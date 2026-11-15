<?php

use App\Support\ApiDocsUi;
use Illuminate\Support\Facades\Hash;

/**
 * Interface da documentação: Swagger UI (padrão) ou Scalar, escolhida por API_DOCS_UI.
 * As duas usam as mesmas URLs, o mesmo JSON, os mesmos middlewares e a mesma CSP com nonce.
 */
function nonceDaCsp($response): ?string
{
    return preg_match("/'nonce-([^']+)'/", (string) $response->headers->get('Content-Security-Policy'), $m) ? $m[1] : null;
}

test('por padrão a documentação continua sendo o Swagger UI', function () {
    config(['api_docs.ui' => 'swagger']);

    $html = $this->get('/api/documentation')->assertOk()->getContent();

    expect($html)->toContain('SwaggerUIBundle')
        ->not->toContain('Scalar.createApiReference');
});

test('com API_DOCS_UI=scalar a mesma URL exibe o Scalar com o bundle local', function () {
    config(['api_docs.ui' => 'scalar']);

    $html = $this->get('/api/documentation')->assertOk()->getContent();

    expect($html)->toContain('Scalar.createApiReference')
        ->toContain('/vendor/scalar/standalone.js')
        ->toContain('api/documentation/docs')
        ->not->toContain('SwaggerUIBundle')
        ->not->toContain('cdn.jsdelivr');
});

test('o bundle do Scalar existe em public/vendor/scalar', function () {
    expect(public_path('vendor/scalar/standalone.js'))->toBeFile();
});

test('o Scalar recebe a CSP restrita com nonce, sem unsafe-eval e sem unsafe-inline em scripts', function () {
    config(['api_docs.ui' => 'scalar']);

    $response = $this->get('/api/documentation')->assertOk();
    $csp = $response->headers->get('Content-Security-Policy');

    expect($csp)->toContain("script-src 'self' 'nonce-")
        ->toContain("connect-src 'self'")
        ->toContain("frame-ancestors 'none'")
        ->not->toContain('unsafe-eval')
        ->not->toMatch('/script-src[^;]*unsafe-inline/');

    expect(nonceDaCsp($response))->not->toBeEmpty();
    expect($response->getContent())->toContain('<script nonce="'.nonceDaCsp($response).'">');
});

test('cada resposta do Scalar usa um nonce diferente', function () {
    config(['api_docs.ui' => 'scalar']);

    expect(nonceDaCsp($this->get('/api/documentation')))->not->toBe(nonceDaCsp($this->get('/api/documentation')));
});

test('a documentação Admin com Scalar continua exigindo HTTP Basic', function () {
    config(['api_docs.ui' => 'scalar']);

    $this->get('/api/documentation/admin')->assertStatus(401);

    config([
        'swagger_admin.username' => 'doc',
        'swagger_admin.password_hash' => base64_encode(Hash::make('segredo-123')),
    ]);

    $this->get('/api/documentation/admin', ['Authorization' => 'Basic '.base64_encode('doc:wrong')])->assertStatus(401);

    $html = $this->get('/api/documentation/admin', ['Authorization' => 'Basic '.base64_encode('doc:segredo-123')])
        ->assertOk()
        ->getContent();

    expect($html)->toContain('Scalar.createApiReference')->toContain('api/documentation/admin/docs');
});

test('o JSON da documentação mantém a CSP restritiva também com o Scalar', function () {
    config(['api_docs.ui' => 'scalar']);

    expect($this->get('/api/documentation/docs')->headers->get('Content-Security-Policy'))
        ->toBe("default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
});

test('valor desconhecido em API_DOCS_UI cai no Swagger UI', function () {
    config(['api_docs.ui' => 'redoc']);

    expect(ApiDocsUi::ativa())->toBe('swagger');

    $this->get('/api/documentation')->assertOk()->assertSee('SwaggerUIBundle', false);

    expect(ApiDocsUi::normalizar(null))->toBe('swagger')
        ->and(ApiDocsUi::normalizar(' SCALAR '))->toBe('scalar')
        ->and(ApiDocsUi::normalizar('Swagger'))->toBe('swagger');
});

test('a configuração do Scalar desliga tudo que chamaria um serviço externo', function () {
    $c = ApiDocsUi::configuracaoScalar('http://localhost/api/documentation/docs/api-docs.json', 'API');

    expect($c['url'])->toBe('http://localhost/api/documentation/docs/api-docs.json')
        ->and($c['telemetry'])->toBeFalse()
        ->and($c['withDefaultFonts'])->toBeFalse()
        ->and($c['agent'])->toBe(['disabled' => true])
        ->and($c['mcp'])->toBe(['disabled' => true])
        ->and($c['authentication']['preferredSecurityScheme'])->toBe('bearerAuth');
});

test('tema ou layout inválidos do Scalar voltam ao padrão', function () {
    config(['api_docs.scalar.theme' => 'inexistente', 'api_docs.scalar.layout' => 'xyz']);

    $c = ApiDocsUi::configuracaoScalar('/docs.json', 'API');

    expect($c['theme'])->toBe('default')->and($c['layout'])->toBe('modern');

    config(['api_docs.scalar.theme' => 'moon', 'api_docs.scalar.layout' => 'classic']);

    $c = ApiDocsUi::configuracaoScalar('/docs.json', 'API');

    expect($c['theme'])->toBe('moon')->and($c['layout'])->toBe('classic');
});

test('atualizarEnv troca a linha existente ou acrescenta ao final, sem mexer no resto', function () {
    expect(ApiDocsUi::atualizarEnv("APP_NAME=x\nAPI_DOCS_UI=swagger\nOUTRA=1\n", 'scalar'))
        ->toBe("APP_NAME=x\nAPI_DOCS_UI=scalar\nOUTRA=1\n");

    expect(ApiDocsUi::atualizarEnv("APP_NAME=x\nOUTRA=1", 'scalar'))
        ->toBe("APP_NAME=x\nOUTRA=1\nAPI_DOCS_UI=scalar\n");

    expect(ApiDocsUi::atualizarEnv('', 'swagger'))->toBe("API_DOCS_UI=swagger\n");

    // .env com quebra de linha do Windows não perde o \r.
    expect(ApiDocsUi::atualizarEnv("A=1\r\nAPI_DOCS_UI=swagger\r\nB=2\r\n", 'scalar'))
        ->toBe("A=1\r\nAPI_DOCS_UI=scalar\r\nB=2\r\n");

    // Valor inválido nunca é gravado.
    expect(ApiDocsUi::atualizarEnv("API_DOCS_UI=scalar\n", 'qualquer'))->toBe("API_DOCS_UI=swagger\n");
});

test('o comando api-docs:gerar recusa uma interface inválida', function () {
    $this->artisan('api-docs:gerar', ['ui' => 'redoc', '--sem-gerar' => true])->assertFailed();
});

test('o comando api-docs:gerar --sem-gerar só mostra a interface atual', function () {
    config(['api_docs.ui' => 'scalar']);

    $this->artisan('api-docs:gerar', ['--sem-gerar' => true])
        ->expectsOutputToContain('SCALAR')
        ->assertSuccessful();
});

test('em produção o comando api-docs:gerar não altera o .env', function () {
    app()->detectEnvironment(fn () => 'production');

    $this->artisan('api-docs:gerar', ['ui' => 'scalar', '--sem-gerar' => true])->assertFailed();
});
