<?php

use Tests\TestCase;

/**
 * Guarda: toda chave usada em `$this->authorize('chave')` nos controllers precisa existir nos
 * seeders de permissão. Uma chave digitada errada nunca é concedida a ninguém, e a rota passa a
 * dar 403 para todos (ou, pior, passa despercebida).
 *
 * LIMITE CONHECIDO: não detecta uma chave que EXISTE mas é a errada para a ação (foi o caso de
 * `EmpresaEnderecoController::atualizar` usando a permissão de contato). Isso só um teste de
 * comportamento da rota pega — ver `tests/Feature/EmpresaEnderecoAutorizacaoTest.php`.
 */
uses(TestCase::class);

function chavesSemeadas(): array
{
    $chaves = [];

    foreach (glob(base_path('database/seeders/*PermissaoSeeder.php')) as $arquivo) {
        preg_match_all('/[\'"]chave[\'"]\s*=>\s*[\'"]([^\'"]+)[\'"]/', file_get_contents($arquivo), $achadas);
        $chaves = array_merge($chaves, $achadas[1]);
    }

    return array_values(array_unique($chaves));
}

/** @return array<string, string> chave => primeiro arquivo que a usa */
function chavesAutorizadas(): array
{
    $usadas = [];
    $iterador = new RecursiveIteratorIterator(new RecursiveDirectoryIterator(app_path('Http/Controllers')));

    foreach ($iterador as $arquivo) {
        if (! $arquivo->isFile() || $arquivo->getExtension() !== 'php') {
            continue;
        }

        preg_match_all('/->authorize\(\s*[\'"]([^\'"]+)[\'"]/', file_get_contents($arquivo->getPathname()), $achadas);

        foreach ($achadas[1] as $chave) {
            $usadas[$chave] ??= str_replace(base_path().'/', '', $arquivo->getPathname());
        }
    }

    return $usadas;
}

it('os seeders de permissão e os controllers foram encontrados (a guarda não está vazia)', function () {
    expect(count(chavesSemeadas()))->toBeGreaterThan(50);
    expect(count(chavesAutorizadas()))->toBeGreaterThan(50);
});

it('toda chave usada em authorize() existe nos seeders de permissão', function () {
    $semeadas = chavesSemeadas();
    $ausentes = [];

    foreach (chavesAutorizadas() as $chave => $arquivo) {
        if (! in_array($chave, $semeadas, true)) {
            $ausentes[] = "{$chave} (usada em {$arquivo})";
        }
    }

    expect($ausentes)->toBe([], 'Chaves de authorize() sem seeder: '.implode('; ', $ausentes));
});
