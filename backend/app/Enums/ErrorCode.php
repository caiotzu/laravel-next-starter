<?php

namespace App\Enums;

/**
 * Convenção de código:
 *   HTTP CODE (3 dígitos) + Número do Model (2 dígitos)
 *
 * Cada model tem um número fixo (01, 02, 03...), usado nos erros "padrão"
 * (UNAUTHORIZED, NOT_FOUND, REQUIRED).
 *
 * Quando o model precisa de mais de um erro na mesma faixa HTTP
 * (ex.: dois códigos 422, ou um segundo 404), some +10 ao número do
 * model a cada variante extra — nunca invente um número solto.
 * Ex.: Empresa = 04 → 1ª variante extra = 14, 2ª = 24...
 */
enum ErrorCode: int
{
    // Grupo Empresa (model) -> 01
    case GRUPO_EMPRESA_NOT_FOUND = 40401;
    case GRUPO_EMPRESA_REQUIRED = 42201;

    // Usuário Sessão (model) -> 02
    case USUARIO_SESSAO_UNAUTHORIZED = 40102;
    case USUARIO_SESSAO_NOT_FOUND = 40402;

    // Usuário (model) -> 03
    case USUARIO_UNAUTHORIZED = 40103;
    case USUARIO_NOT_FOUND = 40403;
    case USUARIO_REQUIRED = 42203;

    // Empresa (model) -> 04
    case EMPRESA_NOT_FOUND = 40404;
    case EMPRESA_REQUIRED = 42204;
    case EMPRESA_MATRIZ_INVALIDA = 40414; // variante extra de 404 (04 + 10)

    // Empresa Contato (model) -> 05
    case EMPRESA_CONTATO_NOT_FOUND = 40405;
    case EMPRESA_CONTATO_REQUIRED = 42205;

    // Empresa Endereço (model) -> 06
    case EMPRESA_ENDERECO_NOT_FOUND = 40406;
    case EMPRESA_ENDERECO_REQUIRED = 42206;

    // Grupo (model) -> 07
    case GRUPO_NOT_FOUND = 40407;
    case GRUPO_REQUIRED = 42207;
    case GRUPO_ALREADY_EXISTS = 40907;

    // Mensagem (model) -> 08
    case MENSAGEM_NOT_FOUND = 40408;
    case MENSAGEM_REQUIRED = 42208;
    case MENSAGEM_DIRECIONAMENTO_INVALIDO = 42218; // variante extra de 422 (08 + 10)

    // Acesso Suporte (model) -> 10
    case ACESSO_SUPORTE_UNAUTHORIZED = 40110;
    case ACESSO_SUPORTE_NOT_FOUND = 40410;
    case ACESSO_SUPORTE_REQUIRED = 42210;

    // Chamado (model) -> 11
    case CHAMADO_NOT_FOUND = 40411;
    case CHAMADO_ENCERRADO = 42211;
    case CHAMADO_ANEXO_INVALIDO = 42221; // variante extra de 422 (11 + 10)

    // Banner (model) -> 12
    case BANNER_NOT_FOUND = 40412;
    case BANNER_IMAGEM_INVALIDA = 42212;
    case BANNER_DIRECIONAMENTO_INVALIDO = 42222; // variante extra de 422 (12 + 10)
}
