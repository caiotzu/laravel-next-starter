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
