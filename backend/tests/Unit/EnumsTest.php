<?php

use App\Enums\ChamadoStatus;
use App\Enums\EmpresaContatoTipo;
use App\Enums\EmpresaEnderecoTipo;
use App\Enums\EntidadeTipo;
use App\Enums\UF;
use App\Enums\UsuarioStatus;

/**
 * Descobre todos os enums de app/Enums para validar o contrato comum
 * (valores únicos, from/tryFrom coerentes e label() preenchido).
 */
function todosOsEnums(): array
{
    $enums = [];

    foreach (glob(dirname(__DIR__, 2) . '/app/Enums/*.php') as $arquivo) {
        $classe = 'App\\Enums\\' . basename($arquivo, '.php');

        if (enum_exists($classe)) {
            $enums[basename($arquivo, '.php')] = [$classe];
        }
    }

    return $enums;
}

dataset('enums', todosOsEnums());

it('possui valores únicos e from/tryFrom coerentes', function (string $classe) {
    $valores = array_map(fn ($case) => $case->value, $classe::cases());

    expect($valores)->not->toBeEmpty();
    expect(array_unique($valores))->toHaveCount(count($valores));

    foreach ($classe::cases() as $case) {
        expect($classe::from($case->value))->toBe($case);
        expect($classe::tryFrom($case->value))->toBe($case);
    }

    $inexistente = is_int($valores[0]) ? PHP_INT_MIN : 'valor-inexistente-xyz';

    expect($classe::tryFrom($inexistente))->toBeNull();
})->with('enums');

it('retorna label preenchido quando o enum define label()', function (string $classe) {
    if (! method_exists($classe, 'label')) {
        expect(true)->toBeTrue();

        return;
    }

    foreach ($classe::cases() as $case) {
        if ((new ReflectionMethod($case, 'label'))->getNumberOfRequiredParameters() > 0) {
            continue;
        }

        expect($case->label())->toBeString()->not->toBeEmpty();
    }
})->with('enums');

it('rejeita valor inválido com ValueError', function () {
    UsuarioStatus::from('inexistente');
})->throws(ValueError::class);

test('EntidadeTipo possui apenas admin e private', function () {
    expect(array_map(fn ($c) => $c->value, EntidadeTipo::cases()))->toBe(['admin', 'private']);
});

test('UsuarioStatus mantém os valores de negócio', function () {
    expect(UsuarioStatus::CONVIDADO->value)->toBe('convidado');
    expect(UsuarioStatus::ATIVO->value)->toBe('ativo');
    expect(UsuarioStatus::EXPIRADO->value)->toBe('expirado');
    expect(UsuarioStatus::INATIVO->value)->toBe('inativo');
    expect(UsuarioStatus::BLOQUEADO->value)->toBe('bloqueado');
});

test('ChamadoStatus: encerrados e bloqueio de mensagens', function () {
    expect(ChamadoStatus::FECHADO->estaEncerrado())->toBeTrue();
    expect(ChamadoStatus::CANCELADO->estaEncerrado())->toBeTrue();
    expect(ChamadoStatus::RESOLVIDO->estaEncerrado())->toBeFalse();
    expect(ChamadoStatus::ABERTO->estaEncerrado())->toBeFalse();

    expect(ChamadoStatus::RESOLVIDO->bloqueiaMensagens())->toBeTrue();
    expect(ChamadoStatus::EM_ATENDIMENTO->bloqueiaMensagens())->toBeFalse();

    expect(array_values(ChamadoStatus::encerradosValues()))->toEqualCanonicalizing(['fechado', 'cancelado']);
    expect(array_values(ChamadoStatus::bloqueiaMensagensValues()))->toEqualCanonicalizing(['resolvido', 'fechado', 'cancelado']);
    expect(ChamadoStatus::EM_ATENDIMENTO->label())->toBe('Em atendimento');
});

test('lookups retornam valor e descrição', function () {
    expect(EmpresaContatoTipo::lookup())->toBe([
        ['valor' => 'T', 'descricao' => 'Telefone'],
        ['valor' => 'E', 'descricao' => 'E-mail'],
    ]);

    foreach (EmpresaEnderecoTipo::lookup() as $item) {
        expect($item)->toHaveKeys(['valor', 'descricao']);
    }
});

test('UF contém os 27 estados', function () {
    expect(UF::cases())->toHaveCount(27);
    expect(UF::tryFrom('SP'))->not->toBeNull();
});
