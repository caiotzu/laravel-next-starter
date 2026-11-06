<?php

namespace App\Providers;

use Illuminate\Http\Request;
use Illuminate\Support\ServiceProvider;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

use App\Services\CepService;
use App\Services\External\Cep\ViaCepService;
use App\Services\External\Cep\BrasilApiService;

use App\Services\External\Email\MailtrapService;
use App\Services\External\Email\AmazonSesService;

use App\Contracts\Email\EmailProviderInterface;
use App\Contracts\Storage\FileStorageInterface;

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

        // Storage de arquivos: a escolha do provider fica só na configuração
        // (config/api.php -> 'storage'); o código de negócio recebe FileStorageInterface.
        $this->app->bind(FileStorageInterface::class, function ($app) {
            $driver = (string) config('api.storage.driver');
            $config = config("api.storage.drivers.{$driver}");

            if (! is_array($config) || empty($config['adapter'])) {
                throw new \InvalidArgumentException(
                    "FILE_STORAGE_DRIVER '{$driver}' não é um storage de arquivos configurado (config/api.php)."
                );
            }

            return $app->make($config['adapter'], ['discos' => $config['discos'] ?? []]);
        });
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

        // Download de anexos por link assinado (uma tela pode carregar várias imagens).
        RateLimiter::for('download-anexo', function (Request $request) {
            return Limit::perMinute(120)->by($request->ip());
        });

        // Documentação Admin (Basic Auth): limita tentativas de adivinhar a senha.
        RateLimiter::for('swagger-admin', function (Request $request) {
            return Limit::perMinute(20)->by($request->ip());
        });

        // Endpoints públicos de recuperação e onboarding (primeiro-acesso, redefinir-senha,
        // esqueceu-senha, version). Os tokens desses fluxos têm alta entropia, então o limite é só
        // contra inundação. Era 10 req/min por IP: num escritório (um IP público para todos) a
        // integração de uma empresa nova, com vários usuários abrindo o primeiro acesso ao mesmo
        // tempo, recebia 429.
        RateLimiter::for('api-publica', function (Request $request) {
            return Limit::perMinute(30)->by($request->ip());
        });

        // Login e 2FA (Admin e Private): SÓ um teto de inundação por IP. A proteção contra adivinhar
        // senha e código está nos controllers e conta apenas FALHAS (login por IP+e-mail e por IP,
        // 2FA por usuário e por IP). Antes estas rotas dividiam o `api-publica` (10 req/min por IP):
        // num escritório, a 6ª pessoa a entrar com 2FA no mesmo minuto levava 429 (cada login com
        // 2FA são 2 requisições), mesmo digitando tudo certo.
        RateLimiter::for('autenticacao', function (Request $request) {
            return Limit::perMinute(120)->by($request->ip());
        });

        // "Esqueceu a senha": além do teto por IP (api-publica), limita por E-MAIL de destino, para
        // ninguém usar o sistema para inundar a caixa de entrada de outra pessoa (nem de vários IPs).
        RateLimiter::for('esqueceu-senha', function (Request $request) {
            $email = Str::lower(trim((string) $request->input('email')));

            return Limit::perMinute(5)->by($email !== '' ? 'email:'.$email : 'ip:'.$request->ip());
        });
    }
}
