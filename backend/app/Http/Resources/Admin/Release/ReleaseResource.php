<?php

namespace App\Http\Resources\Admin\Release;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReleaseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'contexto' => $this->whenLoaded('entidadeTipo', fn () => $this->entidadeTipo->chave),
            'titulo' => $this->titulo,
            'conteudo' => $this->conteudo,
            'tipo' => $this->tipo,
            'tipo_label' => $this->tipo->label(),
            'versao' => $this->versao,
            'status' => $this->status,
            'publicado_em' => $this->publicado_em,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
