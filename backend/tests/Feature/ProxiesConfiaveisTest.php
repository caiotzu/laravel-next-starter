<?php

/**
 * TRUSTED_PROXIES (config/trustedproxy.php): é o que faz o Laravel enxergar o IP do usuário final
 * (enviado pelo BFF Next.js em X-Forwarded-For) e não o IP do servidor Next. Sem isso todos os
 * usuários dividem a mesma cota de rate limit (checklist de produção, item crítico).
 */

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

beforeEach(function () {
    Route::get('/_teste-ip-do-cliente', fn (Request $request) => response()->json(['ip' => $request->ip()]));
});

function chamarComoProxy(string $ipDoProxy, ?string $encaminhado)
{
    $cabecalhos = $encaminhado === null ? [] : ['X-Forwarded-For' => $encaminhado];

    return test()
        ->withServerVariables(['REMOTE_ADDR' => $ipDoProxy])
        ->withHeaders($cabecalhos)
        ->getJson('/_teste-ip-do-cliente');
}

it('proxy confiável: o IP do cliente é o do X-Forwarded-For', function () {
    config(['trustedproxy.proxies' => '10.0.0.5']);

    chamarComoProxy('10.0.0.5', '203.0.113.9')->assertOk()->assertJson(['ip' => '203.0.113.9']);
});

it('faixa CIDR confiável também vale', function () {
    config(['trustedproxy.proxies' => '172.18.0.0/16']);

    chamarComoProxy('172.18.0.7', '203.0.113.9')->assertJson(['ip' => '203.0.113.9']);
});

it('quem NÃO é proxy confiável não consegue forjar o IP', function () {
    config(['trustedproxy.proxies' => '10.0.0.5']);

    chamarComoProxy('198.51.100.20', '203.0.113.9')->assertJson(['ip' => '198.51.100.20']);
});

it('sem TRUSTED_PROXIES o X-Forwarded-For é ignorado (todos pareceriam o IP do servidor Next)', function () {
    config(['trustedproxy.proxies' => null]);

    chamarComoProxy('10.0.0.5', '203.0.113.9')->assertJson(['ip' => '10.0.0.5']);
});

it('"*" confia em quem chama', function () {
    config(['trustedproxy.proxies' => '*']);

    chamarComoProxy('10.0.0.5', '203.0.113.9')->assertJson(['ip' => '203.0.113.9']);
});
