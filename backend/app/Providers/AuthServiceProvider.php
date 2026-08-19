<?php

namespace App\Providers;

use Illuminate\Support\Facades\Gate;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

use App\AcessoSuporte\AcessoSuporteContexto;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        Gate::before(function ($user, string $ability) {

            /**
             * Um Admin em modo de suporte (ver AcessoSuporteMiddleware) pode
             * executar ações do namespace de permissão da entidade
             * concedente (ex: 'private.*', futuramente 'despachante.*'...)
             * — mas SOMENTE enquanto o AcessoSuporteContexto estiver ativo
             * nesta requisição, o que só acontece depois de o middleware
             * validar dono/expiração/status do acesso concedido. O prefixo
             * vem do dado (entidade_tipos.chave), nunca de um nome de
             * entidade escrito no código — isso não altera o grupo nem as
             * permissões permanentes do Admin: fora dessa requisição
             * específica, com um acesso de suporte válido, ele continua sem
             * nenhuma permissão daquele namespace.
             */
            $contexto = app(AcessoSuporteContexto::class);

            if ($contexto->ativo()) {
                $prefixoEntidade = $contexto->entidadeTipoChave();

                if ($prefixoEntidade && str_starts_with($ability, "{$prefixoEntidade}.")) {
                    return true;
                }
            }

            if (!method_exists($user, 'temPermissao')) {
                return null;
            }

            return $user->temPermissao($ability) ?: null;
        });
    }
}
