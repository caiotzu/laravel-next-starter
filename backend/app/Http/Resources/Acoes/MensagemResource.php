<?php

namespace App\Http\Resources\Acoes;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MensagemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'message' => $this['message']
        ];
    }
}
