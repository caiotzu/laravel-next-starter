<?php

use App\Support\VerificacaoProducao;

/**
 * Regras do `php artisan producao:verificar` (docs/checklist-producao.md). Classe pura: sem banco.
 */
function configuracaoDeProducaoValida(array $sobrescrever = []): array
{
    return array_merge([
        'php_version' => '8.5.1',
        'app_env' => 'production',
        'app_debug' => false,
        'app_key' => 'base64:chave',
        'jwt_secret' => 'segredo',
        'app_url' => 'https://api.exemplo.com.br',
        'app_url_frontend' => 'https://app.exemplo.com.br',
        'trusted_proxies' => '10.0.0.5',
        'cors_origins' => ['https://app.exemplo.com.br'],
        'swagger_generate_always' => false,
        'db_password' => str_repeat('a', 24),
        'queue' => 'database',
        'cache' => 'database',
        'log_level' => 'warning',
        'mail_host' => 'smtp.exemplo.com.br',
        'contas_padrao' => [],
    ], $sobrescrever);
}

function chavesComNivel(array $problemas, string $nivel): array
{
    return array_values(array_map(
        fn ($p) => $p['chave'],
        array_filter($problemas, fn ($p) => $p['nivel'] === $nivel)
    ));
}

it('configuração de produção correta não gera nenhum problema', function () {
    expect(VerificacaoProducao::analisar(configuracaoDeProducaoValida()))->toBe([]);
});

it('TRUSTED_PROXIES vazio é erro (todos os usuários dividiriam a mesma cota de limite)', function () {
    foreach (['', '   ', null] as $vazio) {
        $problemas = VerificacaoProducao::analisar(configuracaoDeProducaoValida(['trusted_proxies' => $vazio]));

        expect(chavesComNivel($problemas, 'erro'))->toBe(['TRUSTED_PROXIES']);
        expect(VerificacaoProducao::temErro($problemas))->toBeTrue();
    }
});

it('TRUSTED_PROXIES com "*" é só aviso, e IP ou CIDR não geram problema', function () {
    $coringa = VerificacaoProducao::analisar(configuracaoDeProducaoValida(['trusted_proxies' => '*']));

    expect(chavesComNivel($coringa, 'aviso'))->toBe(['TRUSTED_PROXIES']);
    expect(VerificacaoProducao::temErro($coringa))->toBeFalse();

    foreach (['10.0.0.5', '172.18.0.0/16', '10.0.0.5,10.0.0.6'] as $valor) {
        expect(VerificacaoProducao::analisar(configuracaoDeProducaoValida(['trusted_proxies' => $valor])))->toBe([]);
    }
});

it('APP_ENV diferente de production e APP_DEBUG ligado são erros', function () {
    $problemas = VerificacaoProducao::analisar(configuracaoDeProducaoValida(['app_env' => 'local', 'app_debug' => true]));

    expect(chavesComNivel($problemas, 'erro'))->toBe(['APP_ENV', 'APP_DEBUG']);
});

it('aceita APP_DEBUG como texto "false" (valor vindo do .env)', function () {
    expect(VerificacaoProducao::analisar(configuracaoDeProducaoValida(['app_debug' => 'false'])))->toBe([]);
    expect(chavesComNivel(VerificacaoProducao::analisar(configuracaoDeProducaoValida(['app_debug' => 'true'])), 'erro'))->toBe(['APP_DEBUG']);
});

it('segredos ausentes são erros', function () {
    $problemas = VerificacaoProducao::analisar(configuracaoDeProducaoValida(['app_key' => '', 'jwt_secret' => null]));

    expect(chavesComNivel($problemas, 'erro'))->toBe(['APP_KEY', 'JWT_SECRET']);
});

it('URLs sem https são erros', function () {
    $problemas = VerificacaoProducao::analisar(configuracaoDeProducaoValida([
        'app_url' => 'http://api.exemplo.com.br',
        'app_url_frontend' => 'http://localhost',
    ]));

    expect(chavesComNivel($problemas, 'erro'))->toBe(['APP_URL', 'APP_URL_FRONTEND']);
});

it('CORS: vazio e "*" são erros; localhost e http são avisos', function () {
    expect(chavesComNivel(VerificacaoProducao::analisar(configuracaoDeProducaoValida(['cors_origins' => []])), 'erro'))
        ->toBe(['CORS_ALLOWED_ORIGINS']);

    expect(chavesComNivel(VerificacaoProducao::analisar(configuracaoDeProducaoValida(['cors_origins' => ['*']])), 'erro'))
        ->toBe(['CORS_ALLOWED_ORIGINS']);

    $avisos = VerificacaoProducao::analisar(configuracaoDeProducaoValida([
        'cors_origins' => ['https://app.exemplo.com.br', 'http://localhost:3000', 'http://outro.com.br'],
    ]));

    expect(chavesComNivel($avisos, 'aviso'))->toBe(['CORS_ALLOWED_ORIGINS', 'CORS_ALLOWED_ORIGINS']);
    expect(VerificacaoProducao::temErro($avisos))->toBeFalse();
});

it('senha de banco de exemplo é erro e senha curta é aviso', function () {
    foreach (['', 'password', 'secret', 'PASSWORD'] as $senha) {
        expect(chavesComNivel(VerificacaoProducao::analisar(configuracaoDeProducaoValida(['db_password' => $senha])), 'erro'))
            ->toBe(['DB_PASSWORD']);
    }

    $curta = VerificacaoProducao::analisar(configuracaoDeProducaoValida(['db_password' => 'abc123XYZ']));

    expect(chavesComNivel($curta, 'aviso'))->toBe(['DB_PASSWORD']);
    expect(VerificacaoProducao::temErro($curta))->toBeFalse();
});

it('cache array/null (rate limit não acumula) é erro; fila sync e log debug são avisos', function () {
    expect(chavesComNivel(VerificacaoProducao::analisar(configuracaoDeProducaoValida(['cache' => 'array'])), 'erro'))->toBe(['CACHE_STORE']);
    expect(chavesComNivel(VerificacaoProducao::analisar(configuracaoDeProducaoValida(['cache' => 'null'])), 'erro'))->toBe(['CACHE_STORE']);

    $avisos = VerificacaoProducao::analisar(configuracaoDeProducaoValida(['queue' => 'sync', 'log_level' => 'debug']));

    expect(chavesComNivel($avisos, 'aviso'))->toBe(['QUEUE_CONNECTION', 'LOG_LEVEL']);
    expect(VerificacaoProducao::temErro($avisos))->toBeFalse();
});

it('Swagger gerado a cada requisição é erro; SMTP de desenvolvimento é aviso', function () {
    expect(chavesComNivel(VerificacaoProducao::analisar(configuracaoDeProducaoValida(['swagger_generate_always' => 'true'])), 'erro'))
        ->toBe(['L5_SWAGGER_GENERATE_ALWAYS']);

    expect(chavesComNivel(VerificacaoProducao::analisar(configuracaoDeProducaoValida(['mail_host' => '127.0.0.1'])), 'aviso'))
        ->toBe(['MAIL_HOST']);
});

it('conta de desenvolvimento ainda ativa é erro, uma por conta', function () {
    $problemas = VerificacaoProducao::analisar(configuracaoDeProducaoValida([
        'contas_padrao' => ['admin@admin.com.br', 'private@private.com.br'],
    ]));

    expect(chavesComNivel($problemas, 'erro'))->toBe(['CONTA_PADRAO', 'CONTA_PADRAO']);
    expect($problemas[0]['mensagem'])->toContain('admin@admin.com.br');
});

it('temErro é falso para lista vazia e só com avisos', function () {
    expect(VerificacaoProducao::temErro([]))->toBeFalse();
    expect(VerificacaoProducao::temErro([['nivel' => 'aviso', 'chave' => 'X', 'mensagem' => 'y']]))->toBeFalse();
    expect(VerificacaoProducao::temErro([['nivel' => 'erro', 'chave' => 'X', 'mensagem' => 'y']]))->toBeTrue();
});

it('PHP abaixo de 8.5 é erro; 8.5 ou superior passa', function () {
    foreach (['8.4.12', '8.3.0', '7.4.33'] as $versao) {
        expect(chavesComNivel(VerificacaoProducao::analisar(configuracaoDeProducaoValida(['php_version' => $versao])), 'erro'))
            ->toBe(['PHP']);
    }

    foreach (['8.5.0', '8.5.4', '8.6.0', '9.0.0'] as $versao) {
        expect(VerificacaoProducao::analisar(configuracaoDeProducaoValida(['php_version' => $versao])))->toBe([]);
    }
});
