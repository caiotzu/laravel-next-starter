<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

use App\Services\CepService;
use App\Services\External\Cep\ViaCepService;
use App\Services\External\Cep\BrasilApiService;

use App\Services\External\Email\MailtrapService;
use App\Services\External\Email\AmazonSesService;

use App\Contracts\Email\EmailProviderInterface;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
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
        //
    }
}
