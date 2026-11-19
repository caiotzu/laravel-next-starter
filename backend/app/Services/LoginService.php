<?php

namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Cache;

use Jenssegers\Agent\Agent;

use Tymon\JWTAuth\Facades\JWTAuth;

use App\Models\Usuario;

use App\DTO\UsuarioSessao\UsuarioSessaoCadastroDTO;

/**
 * Passos finais de um login já autenticado por OUTRO meio que não e-mail+senha (hoje, login
 * social): abrir a segunda etapa do 2FA ou emitir sessão + JWT.
 *
 * Usa as mesmas chaves e regras dos AuthController (`2fa_login:{temp_token}` e claim
 * `session_id`), então `/2fa/verificar` conclui um login social sem nenhuma alteração.
 */
class LoginService
{
    public function __construct(
        protected UsuarioService $usuarioService,
        protected UsuarioSessaoService $usuarioSessaoService,
    ) {}

    /** Devolve o `temp_token` (válido por 5 minutos) a ser confirmado em /2fa/verificar. */
    public function iniciarSegundoFator(Usuario $usuario): string
    {
        $tempToken = Str::uuid()->toString();

        Cache::put("2fa_login:{$tempToken}", $usuario->id, now()->addMinutes(5));

        return $tempToken;
    }

    /** @return array{token: string, expires_in: int} */
    public function emitirToken(Usuario $usuario, Request $request): array
    {
        $agent = new Agent();
        $agent->setUserAgent($request->userAgent());

        $sessao = $this->usuarioSessaoService->cadastrar(
            UsuarioSessaoCadastroDTO::criarParaCadastro(
                $usuario->id,
                $request->ip(),
                $request->userAgent(),
                $agent->browser(),
                $agent->platform(),
                $agent->device()
            )
        );

        $token = JWTAuth::claims(['session_id' => $sessao->id])->fromUser($usuario);

        $this->usuarioService->registrarLogin($usuario, $request->ip());

        return [
            'token' => $token,
            'expires_in' => JWTAuth::factory()->getTTL() * 60,
        ];
    }
}
