<?php

namespace App\Services\External\Cep;

use Illuminate\Support\Facades\Http;

use App\Contracts\Cep\CepProviderInterface;

use App\DTO\Lookup\Cep\CepResultadoDTO;

class BrasilApiService implements CepProviderInterface
{
    public function consultar(string $cep): CepResultadoDTO
    {
        $response = Http::timeout(3)
            ->get("https://brasilapi.com.br/api/cep/v1/{$cep}");

        if (!$response->successful()) {
            throw new \Exception('BrasilAPI indisponível');
        }

        $data = $response->json();

        return new CepResultadoDTO(
            cep: $data['cep'],
            logradouro: $data['street'],
            bairro: $data['neighborhood'],
            cidade: $data['city'],
            uf: $data['state'],
            ibge: null,
            siafi: null,
            encontrado: true,
            provider: 'brasil-api',
        );
    }
}
