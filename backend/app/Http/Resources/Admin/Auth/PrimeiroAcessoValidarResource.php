<?php

namespace App\Http\Resources\Admin\Auth;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PrimeiroAcessoValidarResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'nome'  => $this->usuario->nome,
            'email' => $this->usuario->email,
        ];
    }
}
