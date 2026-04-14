<?php

namespace App\Http\Resources\Auth;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LoginResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            '2fa_enable' => $this['2fa_enable'],
            'token' => $this['token'],
            'expires_in' => $this['expires_in']
        ];
    }
}
