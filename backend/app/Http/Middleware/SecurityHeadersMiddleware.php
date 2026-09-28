<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Cabeçalhos de segurança para as respostas da API e da documentação Swagger
 * (que, ao contrário das rotas 'api/*' puras, é HTML renderizado direto no
 * navegador). O frontend Next.js já define o próprio conjunto de cabeçalhos
 * em next.config.ts; este middleware cobre o backend, que sem ele fica
 * inteiramente dependente de um proxy reverso para essa proteção — algo que
 * pode não existir em todo ambiente (ex.: acesso direto em desenvolvimento
 * ou em um deploy sem Nginx na frente).
 *
 * HSTS só é enviado em produção e sobre HTTPS: em HTTP local o cabeçalho é
 * ignorado pelos navegadores e pode ser contraproducente se a app girar
 * localmente sem TLS.
 */
class SecurityHeadersMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        /** @var Response $response */
        $response = $next($request);

        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set(
            'Permissions-Policy',
            'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
        );

        // Resposta JSON pura da API: sem uso de frames/objetos/scripts embutidos.
        if (! $response->headers->has('Content-Security-Policy')) {
            $response->headers->set(
                'Content-Security-Policy',
                "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"
            );
        }

        if (app()->isProduction() && $request->isSecure()) {
            $response->headers->set(
                'Strict-Transport-Security',
                'max-age=31536000; includeSubDomains'
            );
        }

        return $response;
    }
}
