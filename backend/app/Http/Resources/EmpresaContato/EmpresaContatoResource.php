<?php

namespace App\Http\Resources\EmpresaContato;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EmpresaContatoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'empresa_id' => $this->empresa_id,
            'tipo' => $this->tipo->value,
            'tipo_descricao' => $this->tipo->label(),
            'valor' => $this->valor,
            'ativo' => $this->ativo,
            'principal' => $this->principal,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
