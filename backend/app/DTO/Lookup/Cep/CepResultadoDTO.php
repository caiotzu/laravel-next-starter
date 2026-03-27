<?php

namespace App\DTO\Lookup\Cep;

final class CepResultadoDTO
{
    public function __construct(
        public string $cep,
        public readonly ?string $logradouro,
        public readonly ?string $bairro,
        public readonly ?string $cidade,
        public readonly ?string $uf,
        public readonly ?string $ibge,
        public readonly ?string $siafi,
        public readonly bool $encontrado,
        public readonly string $provider,
    ) {
        $this->cep = self::normalizarCep($cep);
    }

    private static function normalizarCep(string $cep): string
    {
        $cep = preg_replace('/\D/', '', $cep);

        return str_pad($cep, 8, '0', STR_PAD_LEFT);
    }
}
