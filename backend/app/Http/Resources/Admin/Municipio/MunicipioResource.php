<?php

namespace App\Http\Resources\Admin\Municipio;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MunicipioResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nome' => $this->nome,
            'uf' => $this->uf,
            'codigo_ibge' => $this->codigo_ibge,
            'codigo_siafi' => $this->codigo_siafi
        ];
    }
}
