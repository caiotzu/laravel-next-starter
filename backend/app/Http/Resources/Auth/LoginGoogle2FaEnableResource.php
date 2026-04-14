<?php

namespace App\Http\Resources\Auth;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LoginGoogle2FaEnableResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            '2fa_enable' => $this['2fa_enable'],
            'temp_token' => $this['temp_token']
        ];
    }
}
