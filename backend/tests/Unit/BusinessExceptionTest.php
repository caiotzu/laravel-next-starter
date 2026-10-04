<?php

use App\Exceptions\BusinessException;

test('usa 400 como status padrão e código 0', function () {
    $e = new BusinessException('Erro de negócio');

    expect($e->getMessage())->toBe('Erro de negócio');
    expect($e->getCode())->toBe(0);
    expect($e->getStatusCode())->toBe(400);
});

test('aceita código e status customizados', function () {
    $e = new BusinessException('Falha', 42, 422);

    expect($e->getCode())->toBe(42);
    expect($e->getStatusCode())->toBe(422);
});
