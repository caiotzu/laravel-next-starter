<?php

namespace App\Providers;

use Illuminate\Http\Request;
use Illuminate\Support\ServiceProvider;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;

use App\Services\CepService;
use App\Services\External\Cep\ViaCepService;
use App\Services\External\Cep\BrasilApiService;

use App\Services\External\Email\MailtrapService;
use App\Services\External\Email\AmazonSesService;

use App\Contracts\Email\EmailProviderInterface;

use App\Auditoria\AuditoriaContexto;
use App\AcessoSuporte\AcessoSuporteContexto;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(AuditoriaContexto::class);
        $this->app->singleton(AcessoSuporteContexto::class);

        $this->app->when(CepService::class)
            ->needs('$providers')
            ->give([
                $this->app->make(ViaCepService::class),
                $this->app->make(BrasilApiService::class),
            ]);

        $this->app->bind(EmailProviderInterface::class,
            function ($app) {
                return match (config('api.email.provider')) {
                    'amazon_ses' => $app->make(AmazonSesService::class),
                    'mailtrap' => $app->make(MailtrapService::class),
                    default => $app->make(AmazonSesService::class),
                };
            }
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Limite padrão para toda a API autenticada
        RateLimiter::for('api-autenticada', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        // Limite mais restritivo para os endpoints públicos sensíveis
        // (esqueceu-senha, primeiro-acesso, redefinir-senha)
        RateLimiter::for('api-publica', function (Request $request) {
            return Limit::perMinute(10)->by($request->ip());
        });
    }
}
