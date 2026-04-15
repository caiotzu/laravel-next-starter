<?php

namespace App\Http\Resources\Lookup\Cep;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CepResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'cep' =>$this->cep,
            'logradouro' =>$this->logradouro,
            'bairro' =>$this->bairro,
            'cidade' =>$this->cidade,
            'uf' =>$this->uf,
            'ibge' =>$this->ibge,
            'siafi' =>$this->siafi,
            'encontrado' =>$this->encontrado,
            'provider' =>$this->provider
        ];
    }
}
