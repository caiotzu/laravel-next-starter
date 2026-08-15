<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Protege a interface/documentação Swagger da área Admin (UI + JSON da
 * spec) com HTTP Basic Auth própria, independente da autenticação da API.
 *
 * Credenciais definidas via .env (nunca hardcoded):
 *   SWAGGER_ADMIN_USERNAME
 *   SWAGGER_ADMIN_PASSWORD_HASH  (hash gerado com `php artisan swagger:admin-hash`,
 *                                 ou com `Hash::make('sua-senha')` no tinker)
 *
 * Se as credenciais não estiverem configuradas, o acesso é bloqueado por
 * padrão (fail-closed) — a documentação Admin nunca fica publicamente
 * acessível sem configuração explícita.
 */
class SwaggerAdminAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        $usuarioConfigurado = config('swagger_admin.username');
        $senhaHashConfigurada = config('swagger_admin.password_hash');

        if (blank($usuarioConfigurado) || blank($senhaHashConfigurada)) {
            return $this->naoAutorizado(
                'A documentação Admin não está configurada. Defina SWAGGER_ADMIN_USERNAME e '
                . 'SWAGGER_ADMIN_PASSWORD_HASH no arquivo .env para liberar o acesso.'
            );
        }

        $usuarioInformado = $request->getUser();
        $senhaInformada = $request->getPassword();

        if (
            $usuarioInformado === null
            || $senhaInformada === null
            || ! hash_equals($usuarioConfigurado, $usuarioInformado)
            || ! password_verify($senhaInformada, $senhaHashConfigurada)
        ) {
            return $this->naoAutorizado('Credenciais inválidas.');
        }

        return $next($request);
    }

    private function naoAutorizado(string $mensagem): Response
    {
        return response($mensagem, 401, [
            'WWW-Authenticate' => 'Basic realm="Swagger Admin"',
        ]);
    }
}
