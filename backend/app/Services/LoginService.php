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
 * Passos finais de QUALQUER login, qualquer que seja o meio que autenticou o usuário (e-mail +
 * senha, login social, 2FA): abrir a segunda etapa do 2FA ou emitir sessão + JWT.
 *
 * É o ÚNICO dono das chaves e regras (`2fa_login:{temp_token}`, claim `session_id`): os
 * AuthController (Admin/Private) e os controllers de login social só chamam este serviço, então
 * `/2fa/verificar` conclui o login de qualquer origem.
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

    /**
     * Abre a sessão e emite o JWT. O array já tem o formato esperado pelo LoginResource.
     *
     * @return array{'2fa_enable': bool, token: string, expires_in: int}
     */
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
            '2fa_enable' => (bool) $usuario->google2fa_enable,
            'token' => $token,
            'expires_in' => JWTAuth::factory()->getTTL() * 60,
        ];
    }
}
