<?php

namespace App\Http\Resources\Global\AutenticacaoSocial;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LoginSocialIniciarResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'url' => $this['url'],
        ];
    }
}
