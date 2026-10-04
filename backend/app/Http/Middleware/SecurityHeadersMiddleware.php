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
        // A tela do Swagger UI é HTML + CSS + JS (inclusive um script inline que
        // monta a interface). Com a política restritiva abaixo (`default-src 'none'`)
        // o navegador bloqueia tudo isso e a página fica em branco. Só ela recebe
        // uma política própria, baseada em nonce; o restante da API continua restrito.
        $nonce = null;

        if ($this->ehInterfaceSwagger($request)) {
            $nonce = base64_encode(random_bytes(16));
            $request->attributes->set('csp_nonce', $nonce);
        }

        /** @var Response $response */
        $response = $next($request);

        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set(
            'Permissions-Policy',
            'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
        );

        if (! $response->headers->has('Content-Security-Policy')) {
            $response->headers->set(
                'Content-Security-Policy',
                $nonce !== null
                    ? $this->politicaSwagger($nonce)
                    // Resposta JSON pura da API: sem uso de frames/objetos/scripts embutidos.
                    : "default-src 'none'; frame-ancestors 'none'; base-uri 'none'"
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

    /**
     * Rotas da interface do l5-swagger (`l5-swagger.{documentacao}.api`).
     * O JSON (`.docs`) e os assets (`.asset`) não entram aqui.
     */
    private function ehInterfaceSwagger(Request $request): bool
    {
        $nome = $request->route()?->getName();

        return is_string($nome) && preg_match('/^l5-swagger\.[^.]+\.api$/', $nome) === 1;
    }

    /**
     * CSP da página do Swagger UI: scripts só da própria origem ou com o nonce desta
     * resposta (sem `unsafe-inline`/`unsafe-eval` para JS). Estilos aceitam inline porque
     * o próprio swagger-ui-bundle.js injeta estilos em tempo de execução (sem isso o
     * navegador bloqueia e registra erros no console); `connect-src` permite o
     * "Try it out" na própria origem e na URL configurada da aplicação.
     */
    private function politicaSwagger(string $nonce): string
    {
        $origens = ["'self'"];

        $parts = parse_url((string) config('app.url'));

        if (! empty($parts['scheme']) && ! empty($parts['host'])) {
            $origens[] = $parts['scheme'] . '://' . $parts['host'] . (isset($parts['port']) ? ':' . $parts['port'] : '');
        }

        return implode('; ', [
            "default-src 'none'",
            "script-src 'self' 'nonce-{$nonce}'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob:",
            "font-src 'self' data:",
            'connect-src ' . implode(' ', array_unique($origens)),
            "frame-ancestors 'none'",
            "base-uri 'none'",
            "form-action 'none'",
        ]);
    }
}
