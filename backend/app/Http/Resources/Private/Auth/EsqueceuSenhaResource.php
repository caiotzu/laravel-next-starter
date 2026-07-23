<?php

namespace App\Http\Resources\Private\Auth;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EsqueceuSenhaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'mensagem' => $this['mensagem']
        ];
    }
}
