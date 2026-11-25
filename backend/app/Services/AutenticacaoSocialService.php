<?php

namespace App\Services;

use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
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
 * VÍNCULO PELO PERFIL: um usuário já autenticado associa (ou remove) a sua conta do provedor.
 * É a única forma de ter uma conta social com e-mail diferente do cadastro. Exige a SENHA atual
 * (uma sessão roubada não pode plantar uma "porta dos fundos" que sobrevive à troca de senha) e o
 * `state` fica preso ao usuário; um state de login não serve para vincular, nem o contrário.
 *
 * O `state` e o `code_verifier` ficam no cache do servidor (uso único, 10 min) e o `state` é
 * amarrado ao navegador que iniciou o fluxo por um `binding` (cookie httpOnly do BFF), contra
 * "login CSRF" (alguém injetar o próprio code no navegador da vítima).
 */
class AutenticacaoSocialService
{
    private const TTL_STATE_MINUTOS = 10;
    private const LIMITE_FALHAS_POR_IP = 30;
    private const LIMITE_FALHAS_SENHA_VINCULO = 5;

    private const FINALIDADE_LOGIN = 'login';
    private const FINALIDADE_VINCULO = 'vinculo';

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
                $ativos[] = ['chave' => $chave, 'nome' => $this->nomeDoProvedor($chave)];
            }
        }

        return $ativos;
    }

    /** Login: registra o `state`/PKCE e devolve a URL de autorização do provedor. */
    public function iniciar(string $provedor, EntidadeTipo $tipo, string $binding): string
    {
        return $this->criarUrlAutorizacao($provedor, $tipo, $binding, self::FINALIDADE_LOGIN, null);
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
        $registro = $this->consumirState($state, $provedor, $tipo, $binding, self::FINALIDADE_LOGIN, null);

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

    /**
     * Contas sociais do usuário: um item por provedor ATIVO (vinculado ou não) e, se houver, os
     * vínculos de provedores hoje desativados — esses só podem ser removidos.
     *
     * @return array<int, array{chave: string, nome: string, disponivel: bool, vinculado: bool, email: ?string, vinculado_em: mixed, ultimo_login_em: mixed}>
     */
    public function listarVinculos(Usuario $usuario): array
    {
        $vinculos = $usuario->identidadesSociais()->get()->keyBy('provedor');

        $itens = [];

        foreach ($this->provedoresAtivos() as $provedor) {
            $itens[] = $this->montarItem($provedor['chave'], $provedor['nome'], true, $vinculos->get($provedor['chave']));
            $vinculos->forget($provedor['chave']);
        }

        foreach ($vinculos as $chave => $vinculo) {
            $itens[] = $this->montarItem($chave, $this->nomeDoProvedor($chave), false, $vinculo);
        }

        return $itens;
    }

    /** @return array{chave: string, nome: string, disponivel: bool, vinculado: bool, email: ?string, vinculado_em: mixed, ultimo_login_em: mixed} */
    public function obterVinculo(Usuario $usuario, string $provedor): array
    {
        $vinculo = $usuario->identidadesSociais()->where('provedor', $provedor)->first();

        return $this->montarItem($provedor, $this->nomeDoProvedor($provedor), $this->provedorDisponivel($provedor), $vinculo);
    }

    /**
     * Vínculo, passo 1: confere a senha e devolve a URL do provedor.
     *
     * @throws BusinessException
     */
    public function iniciarVinculo(Usuario $usuario, string $provedor, EntidadeTipo $tipo, string $senha, string $binding): string
    {
        $this->garantirUsuarioDoTipo($usuario, $tipo);
        $this->adapter($provedor); // 404 se o provedor não estiver disponível

        $chave = 'vinculo-social:senha:' . $usuario->id;

        if (RateLimiter::tooManyAttempts($chave, self::LIMITE_FALHAS_SENHA_VINCULO)) {
            throw new BusinessException('Muitas tentativas. Tente novamente em alguns minutos.', 0, 429);
        }

        if (! Hash::check($senha, (string) $usuario->senha)) {
            RateLimiter::hit($chave, 300);

            throw new BusinessException('A senha está incorreta.', 0, 422);
        }

        RateLimiter::clear($chave);

        if ($usuario->identidadesSociais()->where('provedor', $provedor)->exists()) {
            throw new BusinessException(
                "Você já possui uma conta {$this->nomeDoProvedor($provedor)} vinculada. Desvincule-a antes de vincular outra.",
                0,
                422
            );
        }

        return $this->criarUrlAutorizacao($provedor, $tipo, $binding, self::FINALIDADE_VINCULO, $usuario->id);
    }

    /**
     * Vínculo, passo 2: o retorno do provedor associa a conta ao usuário AUTENTICADO. O e-mail da
     * conta social não precisa ser o do cadastro (o usuário provou as duas coisas), mas precisa
     * estar verificado no provedor.
     *
     * @throws BusinessException
     */
    public function concluirVinculo(
        Usuario $usuario,
        string $provedor,
        EntidadeTipo $tipo,
        string $codigo,
        string $state,
        string $binding,
    ): UsuarioIdentidadeSocial {
        $this->garantirUsuarioDoTipo($usuario, $tipo);

        $registro = $this->consumirState($state, $provedor, $tipo, $binding, self::FINALIDADE_VINCULO, $usuario->id);

        $identidade = $this->adapter($provedor)->obterIdentidade(
            $codigo,
            $this->redirectUri($tipo, $provedor),
            $registro['verifier'],
        );

        $nome = $this->nomeDoProvedor($provedor);

        if (! $identidade->emailVerificado) {
            throw new BusinessException("O e-mail da conta {$nome} não está verificado. Verifique-o no {$nome} e tente novamente.", 0, 422);
        }

        $existente = UsuarioIdentidadeSocial::where('provedor', $identidade->provedor)
            ->where('provedor_usuario_id', $identidade->id)
            ->first();

        if ($existente) {
            if ($existente->usuario_id !== $usuario->id) {
                throw new BusinessException("Esta conta {$nome} já está vinculada a outro usuário.", 0, 422);
            }

            // Mesma conta, mesmo usuário: idempotente (ex.: o retorno do provedor foi repetido).
            $existente->update(['email' => $identidade->email]);

            return $existente;
        }

        if ($usuario->identidadesSociais()->where('provedor', $identidade->provedor)->exists()) {
            throw new BusinessException("Você já possui uma conta {$nome} vinculada. Desvincule-a antes de vincular outra.", 0, 422);
        }

        try {
            return DB::transaction(fn () => $usuario->identidadesSociais()->create([
                'provedor' => $identidade->provedor,
                'provedor_usuario_id' => $identidade->id,
                'email' => $identidade->email,
            ]));
        } catch (UniqueConstraintViolationException) {
            throw new BusinessException("Esta conta {$nome} já está vinculada a outro usuário.", 0, 422);
        }
    }

    /**
     * Remove o vínculo. Funciona mesmo com o provedor desativado (senão o usuário ficaria preso a
     * um vínculo que não consegue remover). O login por senha nunca depende do vínculo.
     *
     * @throws BusinessException
     */
    public function desvincular(Usuario $usuario, string $provedor): void
    {
        $vinculo = $usuario->identidadesSociais()->where('provedor', $provedor)->first();

        if (! $vinculo) {
            throw new BusinessException('Nenhuma conta vinculada para este provedor.', 0, 404);
        }

        // Rede de segurança: o login social nunca é a ÚNICA forma de entrar.
        if (blank($usuario->senha)) {
            throw new BusinessException('Defina uma senha de acesso antes de desvincular a conta.', 0, 422);
        }

        $vinculo->delete();
    }

    private function criarUrlAutorizacao(string $provedor, EntidadeTipo $tipo, string $binding, string $finalidade, ?string $usuarioId): string
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
            'finalidade' => $finalidade,
            'usuario_id' => $usuarioId,
            'binding' => hash('sha256', $binding),
            'verifier' => $verifier,
        ], now()->addMinutes(self::TTL_STATE_MINUTOS));

        return $adapter->urlAutorizacao($this->redirectUri($tipo, $provedor), $state, $challenge);
    }

    /**
     * `pull`: o state é de uso único, mesmo quando a validação falha (sem segunda chance). Só vale
     * para a MESMA finalidade (login x vínculo), área, provedor, navegador e — no vínculo — usuário.
     *
     * @return array{provedor: string, tipo: string, finalidade: string, usuario_id: ?string, binding: string, verifier: ?string}
     *
     * @throws BusinessException
     */
    private function consumirState(string $state, string $provedor, EntidadeTipo $tipo, string $binding, string $finalidade, ?string $usuarioId): array
    {
        $registro = Cache::pull($this->chaveState($state));

        if (
            ! is_array($registro)
            || $registro['provedor'] !== $provedor
            || $registro['tipo'] !== $tipo->value
            || ($registro['finalidade'] ?? null) !== $finalidade
            || ($registro['usuario_id'] ?? null) !== $usuarioId
            || ! hash_equals((string) $registro['binding'], hash('sha256', $binding))
        ) {
            throw new BusinessException(self::MENSAGEM_EXPIRADO, 0, 422);
        }

        return $registro;
    }

    private function garantirUsuarioDoTipo(Usuario $usuario, EntidadeTipo $tipo): void
    {
        $usuario->loadMissing('grupo.entidadeTipo');

        if ($usuario->grupo?->entidadeTipo?->chave?->value !== $tipo->value) {
            throw new BusinessException('Você não tem permissão para executar esta ação.', 0, 403);
        }
    }

    private function nomeDoProvedor(string $chave): string
    {
        return (string) config("api.autenticacao_social.provedores.{$chave}.nome", $chave);
    }

    private function montarItem(string $chave, string $nome, bool $disponivel, ?UsuarioIdentidadeSocial $vinculo): array
    {
        return [
            'chave' => $chave,
            'nome' => $nome,
            'disponivel' => $disponivel,
            'vinculado' => $vinculo !== null,
            'email' => $vinculo?->email,
            'vinculado_em' => $vinculo?->created_at,
            'ultimo_login_em' => $vinculo?->ultimo_login_em,
        ];
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
