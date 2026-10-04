<?php

use App\Support\HtmlSanitizer;

test('retorna vazio para null, vazio e só espaços', function () {
    expect(HtmlSanitizer::sanitizar(null))->toBe('');
    expect(HtmlSanitizer::sanitizar(''))->toBe('');
    expect(HtmlSanitizer::sanitizar("   \n"))->toBe('');
});

test('mantém tags permitidas', function () {
    expect(HtmlSanitizer::sanitizar('<p>Olá <strong>mundo</strong></p>'))->toBe('<p>Olá <strong>mundo</strong></p>');
    expect(HtmlSanitizer::sanitizar('<ul><li>a</li><li>b</li></ul>'))->toBe('<ul><li>a</li><li>b</li></ul>');
});

test('descarta tags perigosas com todo o conteúdo', function () {
    $saida = HtmlSanitizer::sanitizar('<p>ok</p><script>alert(1)</script><iframe src="x"></iframe><style>p{}</style>');

    expect($saida)->toBe('<p>ok</p>');
});

test('remove atributos de eventos e estilos', function () {
    $saida = HtmlSanitizer::sanitizar('<p onclick="x()" style="color:red" class="a">t</p>');

    expect($saida)->toBe('<p>t</p>');
});

test('desembrulha tags desconhecidas mantendo o texto', function () {
    expect(HtmlSanitizer::sanitizar('<div><span>texto</span></div>'))->toBe('texto');
});

test('remove comentários', function () {
    expect(HtmlSanitizer::sanitizar('<p>a</p><!-- segredo -->'))->toBe('<p>a</p>');
});

test('links http/https/mailto/tel ganham target e rel seguros', function () {
    $saida = HtmlSanitizer::sanitizar('<a href="https://exemplo.com" onclick="x()">site</a>');

    expect($saida)->toContain('href="https://exemplo.com"')
        ->toContain('target="_blank"')
        ->toContain('rel="noopener noreferrer nofollow"')
        ->not->toContain('onclick');

    expect(HtmlSanitizer::sanitizar('<a href="mailto:a@b.com">m</a>'))->toContain('href="mailto:a@b.com"');
    expect(HtmlSanitizer::sanitizar('<a href="tel:+5511999999999">t</a>'))->toContain('href="tel:+5511999999999"');
});

test('links com esquemas perigosos ou relativos perdem o href', function (string $href) {
    $saida = HtmlSanitizer::sanitizar('<a href="' . $href . '">x</a>');

    expect($saida)->not->toContain('href')->and($saida)->toContain('x');
})->with([
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    "java\tscript:alert(1)",
    'data:text/html;base64,AAAA',
    'vbscript:x',
    '/caminho/relativo',
    '#ancora',
    '//host.com/x',
]);

test('preserva acentuação UTF-8', function () {
    expect(HtmlSanitizer::sanitizar('<p>ação é útil</p>'))->toBe('<p>ação é útil</p>');
});
