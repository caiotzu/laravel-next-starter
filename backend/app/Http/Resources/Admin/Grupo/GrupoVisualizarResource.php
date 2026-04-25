<?php

namespace App\Http\Resources\Admin\Grupo;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

use App\Http\Resources\Admin\Permissao\PermissaoResource;

class GrupoVisualizarResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'descricao' => $this->descricao,
            'updated_at' => $this->updated_at,
            'created_at' => $this->created_at,
            'deleted_at' => $this->deleted_at,
            'permissoes' => PermissaoResource::collection(
                $this->whenLoaded('permissoes')
            )
        ];
    }
}
