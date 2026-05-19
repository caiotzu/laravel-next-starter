<?php

namespace App\Http\Resources\Admin\GrupoEmpresa;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

use App\Http\Resources\Admin\GrupoEmpresa\UsuarioResource;

class GrupoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'descricao' => $this->descricao,
            'versao' => $this->versao,
            'updated_at' => $this->updated_at,
            'created_at' => $this->created_at,
            'deleted_at' => $this->deleted_at,
            'usuarios' => UsuarioResource::collection(
                $this->whenLoaded('usuarios')
            ),
        ];
    }
}
