<?php

namespace App\Http\Resources\Admin\Permissao;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PermissaoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'chave' => $this->chave,
            'descricao' => $this->descricao,
            'updated_at' => $this->updated_at,
            'created_at' => $this->created_at,
            'deleted_at' => $this->deleted_at,
        ];
    }
}
