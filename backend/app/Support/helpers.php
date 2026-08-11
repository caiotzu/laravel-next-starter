<?php

if (! function_exists('gerar_senha')) {
    function gerar_senha(int $length = 12): string
    {
        $upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
        $lower = 'abcdefghijkmnopqrstuvwxyz';
        $numbers = '23456789';
        $symbols = '!@#$%&*_-';

        $password =
            $upper[random_int(0, strlen($upper) - 1)] .
            $lower[random_int(0, strlen($lower) - 1)] .
            $numbers[random_int(0, strlen($numbers) - 1)] .
            $symbols[random_int(0, strlen($symbols) - 1)];

        $all = $upper . $lower . $numbers . $symbols;

        for ($i = strlen($password); $i < $length; $i++) {
            $password .= $all[random_int(0, strlen($all) - 1)];
        }

        return str_shuffle($password);
    }
}

/**
 * Está será a nova mascara para CNPJ alfanumérico.
 */
if (!function_exists('formatar_cpf_cnpj')) {
    function formatar_cpf_cnpj($cpf_cnpj)
    {
        // Remove tudo que não for letra ou número
        $cpf_cnpj = preg_replace("/[^a-zA-Z0-9]/", "", $cpf_cnpj);
        $cpf_cnpj = strtoupper($cpf_cnpj);

        $qtd = strlen($cpf_cnpj);

        // CPF (continua só número)
        if ($qtd === 11 && ctype_digit($cpf_cnpj)) {
            return substr($cpf_cnpj, 0, 3) . '.' .
                   substr($cpf_cnpj, 3, 3) . '.' .
                   substr($cpf_cnpj, 6, 3) . '-' .
                   substr($cpf_cnpj, 9, 2);
        }

        // CNPJ (agora alfanumérico)
        if ($qtd === 14) {
            return substr($cpf_cnpj, 0, 2) . '.' .
                   substr($cpf_cnpj, 2, 3) . '.' .
                   substr($cpf_cnpj, 5, 3) . '/' .
                   substr($cpf_cnpj, 8, 4) . '-' .
                   substr($cpf_cnpj, 12, 2);
        }

        return $cpf_cnpj;
    }
}
