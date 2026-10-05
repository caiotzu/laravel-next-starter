<?php

use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Storage;

use App\Enums\ArquivoVisibilidade;
use App\Services\Storage\LaravelFileStorage;

uses(Tests\TestCase::class);

const PUB = ArquivoVisibilidade::PUBLICO;
const PRIV = ArquivoVisibilidade::PRIVADO;

function novoStorage(): LaravelFileStorage
{
    Storage::fake('arq_publico');
    Storage::fake('arq_privado');

    return new LaravelFileStorage(['publico' => 'arq_publico', 'privado' => 'arq_privado']);
}

// ---------------------------------------------------------------------------------------
// Operações básicas
// ---------------------------------------------------------------------------------------

test('grava, lê a existência e o tamanho de um arquivo', function () {
    $storage = novoStorage();

    expect($storage->put(PUB, 'avatars/a.png', 'conteudo'))->toBeTrue();
    expect($storage->exists(PUB, 'avatars/a.png'))->toBeTrue();
    expect($storage->size(PUB, 'avatars/a.png'))->toBe(8);

    Storage::disk('arq_publico')->assertExists('avatars/a.png');
});

test('cria os diretórios intermediários automaticamente', function () {
    $storage = novoStorage();

    $storage->put(PRIV, 'chamados/123/456/arquivo.pdf', 'x');

    Storage::disk('arq_privado')->assertExists('chamados/123/456/arquivo.pdf');
});

test('as visibilidades são isoladas entre si', function () {
    $storage = novoStorage();

    $storage->put(PRIV, 'chamados/1/a.pdf', 'segredo');

    expect($storage->exists(PRIV, 'chamados/1/a.pdf'))->toBeTrue();
    expect($storage->exists(PUB, 'chamados/1/a.pdf'))->toBeFalse();
    Storage::disk('arq_publico')->assertMissing('chamados/1/a.pdf');
});

test('remove um arquivo e tratar inexistente não é erro', function () {
    $storage = novoStorage();
    $storage->put(PUB, 'banners/1/a.png', 'x');

    expect($storage->delete(PUB, 'banners/1/a.png'))->toBeTrue();
    expect($storage->exists(PUB, 'banners/1/a.png'))->toBeFalse();

    expect($storage->delete(PUB, 'banners/1/nao-existe.png'))->toBeTrue();
});

test('arquivo inexistente: exists false e size null', function () {
    $storage = novoStorage();

    expect($storage->exists(PUB, 'nao/existe.png'))->toBeFalse();
    expect($storage->size(PUB, 'nao/existe.png'))->toBeNull();
});

test('regrava por cima do mesmo caminho', function () {
    $storage = novoStorage();

    $storage->put(PUB, 'a.txt', 'um');
    $storage->put(PUB, 'a.txt', 'dois-dois');

    expect($storage->size(PUB, 'a.txt'))->toBe(9);
});

test('preserva nomes com acentos, espaços e UUID', function () {
    $storage = novoStorage();
    $caminho = 'chamados/abc/relatório final 2026 (v2).pdf';

    expect($storage->put(PRIV, $caminho, 'x'))->toBeTrue();
    expect($storage->exists(PRIV, $caminho))->toBeTrue();
});

// ---------------------------------------------------------------------------------------
// URL
// ---------------------------------------------------------------------------------------

test('url devolve a URL configurada do disco público (mapeamento padrão local)', function () {
    $storage = new LaravelFileStorage(config('api.storage.drivers.local.discos'));

    expect($storage->url('avatars/a.png'))
        ->toBe(rtrim(config('filesystems.disks.public.url'), '/') . '/avatars/a.png')
        ->toEndWith('/storage/avatars/a.png');
});

test('url usa o disco da visibilidade pública, não o privado', function () {
    Storage::fake('arq_publico', ['url' => 'https://cdn.exemplo.com/p']);
    Storage::fake('arq_privado', ['url' => 'https://privado.exemplo.com']);

    $storage = new LaravelFileStorage(['publico' => 'arq_publico', 'privado' => 'arq_privado']);

    expect($storage->url('a.png'))->toBe('https://cdn.exemplo.com/p/a.png');
});

// ---------------------------------------------------------------------------------------
// Entrega (stream)
// ---------------------------------------------------------------------------------------

test('response entrega o arquivo em stream com cabeçalhos e disposição', function () {
    $storage = novoStorage();
    $storage->put(PRIV, 'chamados/1/doc.pdf', '%PDF-1.4 conteudo');

    $resposta = $storage->response(
        PRIV,
        'chamados/1/doc.pdf',
        'meu documento.pdf',
        ['X-Content-Type-Options' => 'nosniff', 'Content-Type' => 'application/pdf'],
        'attachment'
    );

    expect($resposta)->toBeInstanceOf(Symfony\Component\HttpFoundation\StreamedResponse::class);
    expect($resposta->headers->get('X-Content-Type-Options'))->toBe('nosniff');
    expect($resposta->headers->get('Content-Type'))->toBe('application/pdf');
    expect($resposta->headers->get('Content-Disposition'))->toContain('attachment')->toContain('meu documento.pdf');

    ob_start();
    $resposta->sendContent();
    expect(ob_get_clean())->toBe('%PDF-1.4 conteudo');
});

// ---------------------------------------------------------------------------------------
// Mover entre visibilidades
// ---------------------------------------------------------------------------------------

test('move copia por stream, confere e remove o original', function () {
    $storage = novoStorage();
    $storage->put(PUB, 'chamados/1/a.png', str_repeat('A', 2048));

    expect($storage->move(PUB, PRIV, 'chamados/1/a.png'))->toBeTrue();

    expect($storage->exists(PRIV, 'chamados/1/a.png'))->toBeTrue();
    expect($storage->size(PRIV, 'chamados/1/a.png'))->toBe(2048);
    expect($storage->exists(PUB, 'chamados/1/a.png'))->toBeFalse();
});

test('move de arquivo inexistente retorna false', function () {
    expect(novoStorage()->move(PUB, PRIV, 'nao/existe.png'))->toBeFalse();
});

test('move mantém o original quando a cópia não confere', function () {
    Storage::fake('arq_publico');
    Storage::fake('arq_privado');

    Storage::disk('arq_publico')->put('x/a.bin', 'conteudo-original');

    // Destino que "grava" mas perde bytes: o tamanho não confere.
    $destino = Mockery::mock(FilesystemAdapter::class);
    $destino->shouldReceive('writeStream')->andReturn(true);
    $destino->shouldReceive('exists')->andReturn(true);
    $destino->shouldReceive('size')->andReturn(3);
    Storage::set('arq_privado', $destino);

    $storage = new LaravelFileStorage(['publico' => 'arq_publico', 'privado' => 'arq_privado']);

    expect($storage->move(PUB, PRIV, 'x/a.bin'))->toBeFalse();
    Storage::disk('arq_publico')->assertExists('x/a.bin');
});

test('move com as duas visibilidades no mesmo disco não apaga o arquivo', function () {
    Storage::fake('unico');
    Storage::disk('unico')->put('x/a.bin', 'abc');

    $storage = new LaravelFileStorage(['publico' => 'unico', 'privado' => 'unico']);

    expect($storage->move(PUB, PRIV, 'x/a.bin'))->toBeTrue();
    Storage::disk('unico')->assertExists('x/a.bin');
});

// ---------------------------------------------------------------------------------------
// Erros de storage
// ---------------------------------------------------------------------------------------

test('falha de gravação do disco é refletida no retorno, sem lançar exceção', function () {
    Storage::fake('arq_publico');

    $quebrado = Mockery::mock(FilesystemAdapter::class);
    $quebrado->shouldReceive('put')->andReturn(false);
    Storage::set('arq_privado', $quebrado);

    $storage = new LaravelFileStorage(['publico' => 'arq_publico', 'privado' => 'arq_privado']);

    expect($storage->put(PRIV, 'chamados/1/a.pdf', 'x'))->toBeFalse();
});

test('exige disco configurado para cada visibilidade', function () {
    new LaravelFileStorage(['publico' => 'public']);
})->throws(InvalidArgumentException::class, "visibilidade 'privado'");

// ---------------------------------------------------------------------------------------
// Segurança de caminhos
// ---------------------------------------------------------------------------------------

dataset('caminhos_maliciosos', [
    'path traversal' => '../../etc/passwd',
    'traversal no meio' => 'banners/../../segredo.txt',
    'traversal no fim' => 'banners/..',
    'ponto simples' => './a.png',
    'absoluto' => '/etc/passwd',
    'vazio' => '',
    'byte nulo' => "a.png\0.php",
    'barra invertida' => 'a\\b.png',
]);

it('recusa caminho inválido na escrita, remoção, url e entrega', function (string $caminho) {
    $storage = novoStorage();

    $operacoes = [
        fn () => $storage->put(PUB, $caminho, 'x'),
        fn () => $storage->delete(PUB, $caminho),
        fn () => $storage->url($caminho),
        fn () => $storage->response(PUB, $caminho, 'x'),
        fn () => $storage->move(PUB, PRIV, $caminho),
    ];

    foreach ($operacoes as $operacao) {
        expect($operacao)->toThrow(InvalidArgumentException::class);
    }
})->with('caminhos_maliciosos');

it('trata caminho inválido como inexistente na leitura (download vira 404)', function (string $caminho) {
    $storage = novoStorage();

    expect($storage->exists(PUB, $caminho))->toBeFalse();
    expect($storage->size(PUB, $caminho))->toBeNull();
})->with('caminhos_maliciosos');

test('nomes legítimos com pontos não são confundidos com traversal', function () {
    $storage = novoStorage();

    expect($storage->put(PUB, 'banners/1/foto..final.png', 'x'))->toBeTrue();
    expect($storage->put(PUB, 'banners/1/.oculto', 'x'))->toBeTrue();
});
