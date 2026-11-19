<?php

namespace App\Services;

use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;

use App\Contracts\AutenticacaoSocial\ProvedorSocialInterface;

use App\Models\Usuario;
use App\Models\UsuarioIdentidadeSocial;

use App\DTO\AutenticacaoSocial\IdentidadeSocialDTO;

use App\Exceptions\BusinessException;

use App\Enums\EntidadeTipo;

/**
 * Login social (Google, e futuros provedores) — fluxo authorization code + PKCE.
 *
 * REGRA CENTRAL: o login social NUNCA cria usuário. A identidade do provedor só é aceita se
 * corresponder a um Usuario JÁ cadastrado, ATIVO e do tipo de entidade da rota (Admin/Private),
 * exatamente como o login por senha. Todas as recusas devolvem a MESMA mensagem; o motivo real
 * vai só para o log (sem e-mail em claro).
 *
 * Vínculo: no primeiro login, pelo e-mail VERIFICADO do provedor; a partir daí, pelo
 * identificador estável do provedor (`sub`) — mudar o e-mail na conta Google não troca de dono.
 *
 * O `state` e o `code_verifier` ficam no cache do servidor (uso único, 10 min) e o `state` é
 * amarrado ao navegador que iniciou o fluxo por um `binding` (cookie httpOnly do BFF), contra
 * "login CSRF" (alguém injetar o próprio code no navegador da vítima).
 */
class AutenticacaoSocialService
{
    private const TTL_STATE_MINUTOS = 10;
    private const LIMITE_FALHAS_POR_IP = 30;

    private const MENSAGEM_RECUSADO = 'Não foi possível entrar com esta conta. Verifique se ela está autorizada a acessar a plataforma.';
    private const MENSAGEM_EXPIRADO = 'A tentativa de login expirou ou é inválida. Tente novamente.';

    public function __construct(
        protected UsuarioService $usuarioService,
    ) {}

    /**
     * Provedores que o frontend pode oferecer: ativos na configuração E com credenciais.
     *
     * @return array<int, array{chave: string, nome: string}>
     */
    public function provedoresAtivos(): array
    {
        $ativos = [];

        foreach (array_keys(config('api.autenticacao_social.provedores', [])) as $chave) {
            if ($this->provedorDisponivel($chave)) {
                $ativos[] = ['chave' => $chave, 'nome' => (string) config("api.autenticacao_social.provedores.{$chave}.nome", $chave)];
            }
        }

        return $ativos;
    }

    /** Registra o `state`/PKCE e devolve a URL de autorização do provedor. */
    public function iniciar(string $provedor, EntidadeTipo $tipo, string $binding): string
    {
        $adapter = $this->adapter($provedor);

        $state = Str::random(48);
        $verifier = $adapter->usaPkce() ? Str::random(64) : null;
        $challenge = $verifier !== null
            ? rtrim(strtr(base64_encode(hash('sha256', $verifier, true)), '+/', '-_'), '=')
            : null;

        Cache::put($this->chaveState($state), [
            'provedor' => $provedor,
            'tipo' => $tipo->value,
            'binding' => hash('sha256', $binding),
            'verifier' => $verifier,
        ], now()->addMinutes(self::TTL_STATE_MINUTOS));

        return $adapter->urlAutorizacao($this->redirectUri($tipo, $provedor), $state, $challenge);
    }

    /**
     * Conclui o fluxo e devolve o Usuario autenticado (a emissão do JWT/2FA é do chamador).
     *
     * @throws BusinessException
     */
    public function concluir(
        string $provedor,
        EntidadeTipo $tipo,
        string $codigo,
        string $state,
        string $binding,
        ?string $ip,
    ): Usuario {
        $chaveIp = 'login-social:ip:' . $ip;

        if (RateLimiter::tooManyAttempts($chaveIp, self::LIMITE_FALHAS_POR_IP)) {
            throw new BusinessException('Muitas tentativas de login. Tente novamente em alguns minutos.', 0, 429);
        }

        try {
            return $this->concluirSemLimite($provedor, $tipo, $codigo, $state, $binding);
        } catch (BusinessException $e) {
            RateLimiter::hit($chaveIp, 300);

            throw $e;
        }
    }

    private function concluirSemLimite(string $provedor, EntidadeTipo $tipo, string $codigo, string $state, string $binding): Usuario
    {
        // `pull`: o state é de uso único, mesmo quando a validação falha (sem segunda chance).
        $registro = Cache::pull($this->chaveState($state));

        if (
            ! is_array($registro)
            || $registro['provedor'] !== $provedor
            || $registro['tipo'] !== $tipo->value
            || ! hash_equals((string) $registro['binding'], hash('sha256', $binding))
        ) {
            throw new BusinessException(self::MENSAGEM_EXPIRADO, 0, 422);
        }

        $identidade = $this->adapter($provedor)->obterIdentidade(
            $codigo,
            $this->redirectUri($tipo, $provedor),
            $registro['verifier'],
        );

        if (! $identidade->emailVerificado) {
            $this->recusar('email_nao_verificado', $identidade);
        }

        return $this->resolverUsuario($identidade, $tipo);
    }

    private function resolverUsuario(IdentidadeSocialDTO $identidade, EntidadeTipo $tipo): Usuario
    {
        $vinculo = UsuarioIdentidadeSocial::where('provedor', $identidade->provedor)
            ->where('provedor_usuario_id', $identidade->id)
            ->first();

        if ($vinculo) {
            $usuario = $this->usuarioService->obterUsuarioAtivoPorId($vinculo->usuario_id, $tipo);

            if (! $usuario) {
                $this->recusar('usuario_inativo_ou_outra_area', $identidade);
            }

            $vinculo->update(['email' => $identidade->email, 'ultimo_login_em' => now()]);

            return $usuario;
        }

        // Primeiro login com esta conta: só vincula a um usuário que JÁ existe.
        $usuario = $this->usuarioService->obterUsuarioAtivoPorEmail(Str::lower($identidade->email), $tipo);

        if (! $usuario) {
            $this->recusar('usuario_nao_cadastrado', $identidade);
        }

        // O usuário já usa OUTRA conta deste provedor: um e-mail "reaproveitado" não assume a conta.
        if ($usuario->identidadesSociais()->where('provedor', $identidade->provedor)->exists()) {
            $this->recusar('usuario_ja_vinculado_a_outra_conta', $identidade);
        }

        try {
            DB::transaction(fn () => $usuario->identidadesSociais()->create([
                'provedor' => $identidade->provedor,
                'provedor_usuario_id' => $identidade->id,
                'email' => $identidade->email,
                'ultimo_login_em' => now(),
            ]));
        } catch (UniqueConstraintViolationException) {
            $this->recusar('vinculo_concorrente', $identidade);
        }

        return $usuario;
    }

    private function recusar(string $motivo, IdentidadeSocialDTO $identidade): never
    {
        Log::notice('login_social.recusado', [
            'motivo' => $motivo,
            'provedor' => $identidade->provedor,
            'email_hash' => hash('sha256', Str::lower($identidade->email)),
        ]);

        throw new BusinessException(self::MENSAGEM_RECUSADO, 0, 401);
    }

    private function provedorDisponivel(string $chave): bool
    {
        $config = config("api.autenticacao_social.provedores.{$chave}");

        if (! is_array($config) || empty($config['adapter']) || ! ($config['ativo'] ?? false)) {
            return false;
        }

        return app($config['adapter'])->configurado();
    }

    private function adapter(string $provedor): ProvedorSocialInterface
    {
        if (! $this->provedorDisponivel($provedor)) {
            throw new BusinessException('Provedor de login não disponível.', 0, 404);
        }

        return app(config("api.autenticacao_social.provedores.{$provedor}.adapter"));
    }

    /**
     * O retorno do provedor é para o FRONTEND (BFF), que guarda a sessão em cookie. Cada área tem
     * a sua URL de retorno, a ser cadastrada no console do provedor.
     */
    private function redirectUri(EntidadeTipo $tipo, string $provedor): string
    {
        return rtrim((string) config('app.url_frontend'), '/') . "/api/auth/{$tipo->value}/social/{$provedor}/callback";
    }

    private function chaveState(string $state): string
    {
        return 'login_social:state:' . hash('sha256', $state);
    }
}
