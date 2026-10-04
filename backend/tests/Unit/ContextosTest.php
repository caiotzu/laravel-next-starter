<?php

use App\Auditoria\AuditoriaContexto;
use App\Enums\AuditoriaOrigem;

uses(Tests\TestCase::class);

test('origem forçada tem prioridade e pode ser limpa', function () {
    $contexto = new AuditoriaContexto();

    $contexto->definirOrigem(AuditoriaOrigem::JOB);
    expect($contexto->origem())->toBe(AuditoriaOrigem::JOB);

    $contexto->limparOrigem();
    expect($contexto->origem())->not->toBe(AuditoriaOrigem::JOB);
});

test('sem usuário autenticado em console a origem é console e não há usuário', function () {
    $contexto = new AuditoriaContexto();

    expect($contexto->usuarioId())->toBeNull();
    expect($contexto->origem())->toBe(AuditoriaOrigem::CONSOLE);
});

test('sem acesso de suporte em uso o id é nulo', function () {
    expect((new AuditoriaContexto())->acessoSuporteId())->toBeNull();
});
