<?php

namespace App\Http\Resources\Private\Banner;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BannerLinkResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            // O nome do link é usado como texto do botão na exibição.
            'nome' => $this->nome,
            'url' => $this->url,
        ];
    }
}
