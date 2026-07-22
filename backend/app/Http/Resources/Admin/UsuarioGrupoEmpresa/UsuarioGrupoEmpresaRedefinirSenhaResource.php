<?php

namespace App\Http\Resources\Admin\UsuarioGrupoEmpresa;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UsuarioGrupoEmpresaRedefinirSenhaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'mensagem' => $this['mensagem']
        ];
    }
}
