<?php

test('formatar_cpf_cnpj formata CPF', function () {
    expect(formatar_cpf_cnpj('12345678901'))->toBe('123.456.789-01');
    expect(formatar_cpf_cnpj('123.456.789-01'))->toBe('123.456.789-01');
});

test('formatar_cpf_cnpj formata CNPJ numérico e alfanumérico', function () {
    expect(formatar_cpf_cnpj('12345678000195'))->toBe('12.345.678/0001-95');
    expect(formatar_cpf_cnpj('12.ABC.345/01DE-35'))->toBe('12.ABC.345/01DE-35');
    expect(formatar_cpf_cnpj('12abc34501de35'))->toBe('12.ABC.345/01DE-35');
});

test('formatar_cpf_cnpj devolve apenas alfanuméricos quando o tamanho não é conhecido', function () {
    expect(formatar_cpf_cnpj('123-45'))->toBe('12345');
    expect(formatar_cpf_cnpj(''))->toBe('');
});
