<?php

namespace App\Http\Resources\Private\Auth;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RedefinirSenhaValidarResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'nome'  => $this->usuario->nome,
            'email' => $this->usuario->email,
        ];
    }
}
