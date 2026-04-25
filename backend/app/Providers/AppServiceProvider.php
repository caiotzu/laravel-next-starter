<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

use App\Services\CepService;
use App\Services\External\Cep\ViaCepService;
use App\Services\External\Cep\BrasilApiService;


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
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
