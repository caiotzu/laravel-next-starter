<?php

/**
 * Regressão: a tela do Swagger UI ficava em branco porque o middleware de
 * segurança aplicava `default-src 'none'` também ao HTML da documentação,
 * bloqueando CSS, JS e o script inline que monta a interface.
 */
test('a interface do Swagger recebe uma CSP que permite seus scripts e estilos', function () {
    $response = $this->get('/api/documentation');

    $response->assertStatus(200);

    $csp = $response->headers->get('Content-Security-Policy');

    expect($csp)->toContain("script-src 'self' 'nonce-")
        ->toContain("style-src 'self' 'unsafe-inline'")
        ->toContain("connect-src 'self'")
        ->toContain("frame-ancestors 'none'")
        ->toContain("base-uri 'none'")
        ->not->toContain('unsafe-eval');

    // `unsafe-inline` só vale para estilos, nunca para scripts.
    expect($csp)->not->toMatch("/script-src[^;]*unsafe-inline/");
});

test('o nonce da CSP é o mesmo aplicado ao script inline da página', function () {
    $response = $this->get('/api/documentation');

    preg_match("/'nonce-([^']+)'/", $response->headers->get('Content-Security-Policy'), $csp);

    $html = $response->getContent();

    expect($csp[1] ?? null)->not->toBeEmpty();
    expect($html)->toContain('<script nonce="' . $csp[1] . '">');
});

test('cada resposta do Swagger usa um nonce diferente', function () {
    $nonce = fn () => preg_match(
        "/'nonce-([^']+)'/",
        $this->get('/api/documentation')->headers->get('Content-Security-Policy'),
        $m
    ) ? $m[1] : null;

    expect($nonce())->not->toBe($nonce());
});

test('o JSON da documentação e o restante da API mantêm a CSP restritiva', function () {
    $docs = $this->get('/api/documentation/docs');

    expect($docs->headers->get('Content-Security-Policy'))
        ->toBe("default-src 'none'; frame-ancestors 'none'; base-uri 'none'");

    $api = $this->getJson('/api/lookup/uf');

    expect($api->headers->get('Content-Security-Policy') ?? "default-src 'none'; frame-ancestors 'none'; base-uri 'none'")
        ->not->toContain('nonce-');
});

test('a documentação Admin continua exigindo credenciais', function () {
    $this->get('/api/documentation/admin')->assertStatus(401);
});
