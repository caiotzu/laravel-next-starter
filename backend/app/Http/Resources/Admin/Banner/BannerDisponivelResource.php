<?php

namespace App\Http\Resources\Admin\Banner;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BannerDisponivelResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'titulo' => $this->titulo,
            'conteudo' => $this->conteudo,
            'imagens' => BannerImagemResource::collection($this->whenLoaded('imagens')),
            'links' => BannerLinkResource::collection($this->whenLoaded('links')),
        ];
    }
}
