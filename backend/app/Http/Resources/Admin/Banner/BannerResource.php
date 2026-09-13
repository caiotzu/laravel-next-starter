<?php

namespace App\Http\Resources\Admin\Banner;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BannerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'titulo' => $this->titulo,
            'conteudo' => $this->conteudo,
            'status' => $this->status,
            'status_label' => $this->status?->label(),
            'direcionamento' => [
                'tipo' => $this->direcionamento_tipo,
                'tipo_label' => $this->direcionamento_tipo?->label(),
                'entidade_tipo' => $this->entidadeTipo?->chave,
            ],
            'inicio_em' => $this->inicio_em,
            'fim_em' => $this->fim_em,
            'imagens' => BannerImagemResource::collection($this->whenLoaded('imagens')),
            'links' => BannerLinkResource::collection($this->whenLoaded('links')),
            'total_imagens' => $this->whenCounted('imagens'),
            'updated_at' => $this->updated_at,
            'created_at' => $this->created_at,
            'deleted_at' => $this->deleted_at,
        ];
    }
}
