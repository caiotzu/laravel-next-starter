<?php

namespace App\Http\Resources\Admin\AutenticacaoDoisFatores;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AutenticacaoDoisFatoresResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'secret' => $this['secret'],
            'otpauth_url' => $this['otpauth_url']
        ];
    }
}
