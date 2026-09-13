<?php

namespace App\Http\Resources\Private\Banner;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Representação pública do banner (ponto de vista do usuário Private): só
 * o necessário para a exibição — sem status/direcionamento, que são
 * detalhes administrativos.
 */
class BannerResource extends JsonResource
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
