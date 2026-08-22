<?php

namespace App\Http\Resources\Private\Release;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReleaseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'titulo' => $this->titulo,
            'conteudo' => $this->conteudo,
            'tipo' => $this->tipo,
            'tipo_label' => $this->tipo->label(),
            'versao' => $this->versao,
            'publicado_em' => $this->publicado_em,
        ];
    }
}
