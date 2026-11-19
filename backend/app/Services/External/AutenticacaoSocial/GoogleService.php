<?php

namespace App\Services\External\AutenticacaoSocial;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

use App\Contracts\AutenticacaoSocial\ProvedorSocialInterface;

use App\DTO\AutenticacaoSocial\IdentidadeSocialDTO;

use App\Exceptions\BusinessException;

/**
 * Login com Google (OpenID Connect, authorization code + PKCE).
 *
 * A identidade vem do endpoint `userinfo`, chamado com o access_token que o Google acabou de
 * entregar, por TLS, diretamente a esta classe — não há JWT de terceiros a validar.
 */
class GoogleService implements ProvedorSocialInterface
{
    private const URL_AUTORIZACAO = 'https://accounts.google.com/o/oauth2/v2/auth';
    private const URL_TOKEN = 'https://oauth2.googleapis.com/token';
    private const URL_USERINFO = 'https://openidconnect.googleapis.com/v1/userinfo';

    public function configurado(): bool
    {
        return filled(config('services.google.client_id')) && filled(config('services.google.client_secret'));
    }

    public function usaPkce(): bool
    {
        return true;
    }

    public function urlAutorizacao(string $redirectUri, string $state, ?string $codeChallenge): string
    {
        $parametros = [
            'client_id' => config('services.google.client_id'),
            'redirect_uri' => $redirectUri,
            'response_type' => 'code',
            'scope' => 'openid email profile',
            'state' => $state,
            'access_type' => 'online',
            'prompt' => 'select_account',
        ];

        if ($codeChallenge !== null) {
            $parametros['code_challenge'] = $codeChallenge;
            $parametros['code_challenge_method'] = 'S256';
        }

        return self::URL_AUTORIZACAO . '?' . http_build_query($parametros, '', '&', PHP_QUERY_RFC3986);
    }

    public function obterIdentidade(string $codigo, string $redirectUri, ?string $codeVerifier): IdentidadeSocialDTO
    {
        try {
            $corpoToken = array_filter([
                'code' => $codigo,
                'client_id' => config('services.google.client_id'),
                'client_secret' => config('services.google.client_secret'),
                'redirect_uri' => $redirectUri,
                'grant_type' => 'authorization_code',
                'code_verifier' => $codeVerifier,
            ], fn ($valor) => $valor !== null);

            $token = Http::timeout(5)->asForm()->post(self::URL_TOKEN, $corpoToken);

            if (! $token->successful() || ! is_string($token->json('access_token'))) {
                // Nunca registrar o corpo: pode conter o code/secret ecoados pelo provedor.
                Log::warning('login_social.google.token_recusado', ['status' => $token->status()]);

                throw new BusinessException('Não foi possível validar o login com o Google.', 0, 422);
            }

            $perfil = Http::timeout(5)->withToken($token->json('access_token'))->get(self::URL_USERINFO);
        } catch (BusinessException $e) {
            throw $e;
        } catch (Throwable $e) {
            Log::warning('login_social.google.indisponivel', ['erro' => $e::class]);

            throw new BusinessException('Login com o Google indisponível no momento.', 0, 503);
        }

        $sub = $perfil->json('sub');
        $email = $perfil->json('email');

        if (! $perfil->successful() || ! is_string($sub) || $sub === '' || ! is_string($email) || $email === '') {
            Log::warning('login_social.google.perfil_invalido', ['status' => $perfil->status()]);

            throw new BusinessException('Não foi possível validar o login com o Google.', 0, 422);
        }

        return new IdentidadeSocialDTO(
            provedor: 'google',
            id: $sub,
            email: $email,
            // Normalmente booleano; versões antigas da API devolviam a string "true".
            emailVerificado: filter_var($perfil->json('email_verified'), FILTER_VALIDATE_BOOLEAN),
            nome: is_string($perfil->json('name')) ? $perfil->json('name') : null,
        );
    }
}
