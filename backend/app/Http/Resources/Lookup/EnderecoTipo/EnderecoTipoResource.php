<?php

namespace App\Http\Resources\Lookup\EnderecoTipo;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EnderecoTipoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'valor' => $this['valor'],
            'descricao' => $this['descricao']
        ];
    }
}
