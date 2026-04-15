<?php

namespace App\Http\Resources\Lookup\ContatoTipo;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContatoTipoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'valor' => $this['valor'],
            'descricao' => $this['descricao']
        ];
    }
}
