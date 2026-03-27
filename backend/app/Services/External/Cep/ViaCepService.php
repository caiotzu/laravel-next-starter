<?php

namespace App\Services\External\Cep;

use Illuminate\Support\Facades\Http;

use App\Contracts\Cep\CepProviderInterface;

use App\DTO\Lookup\Cep\CepResultadoDTO;

class ViaCepService implements CepProviderInterface
{
    public function consultar(string $cep): CepResultadoDTO
    {
        $response = Http::timeout(3)->get("https://viacep.com.br/ws/{$cep}/json");

        if (!$response->successful()) {
            throw new \Exception('ViaCEP indisponível');
        }

        $data = $response->json();

        if (isset($data['erro'])) {
            return new CepResultadoDTO(
                cep: $cep,
                logradouro: null,
                bairro: null,
                cidade: null,
                uf: null,
                ibge: null,
                siafi: null,
                encontrado: false,
                provider: 'via-cep',
            );
        }

        return new CepResultadoDTO(
            cep: $data['cep'],
            logradouro: $data['logradouro'],
            bairro: $data['bairro'],
            cidade: $data['localidade'],
            uf: $data['uf'],
            ibge: $data['ibge'],
            siafi: $data['siafi'],
            encontrado: true,
            provider: 'via-cep',
        );
    }
}
