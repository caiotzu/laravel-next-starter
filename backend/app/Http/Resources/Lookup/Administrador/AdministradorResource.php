<?php

namespace App\Http\Resources\Lookup\Administrador;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdministradorResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nome' => $this->nome,
            'email' => $this->email,
        ];
    }
}
