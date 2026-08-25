<?php

namespace App\Http\Resources\Admin\Chamado;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChamadoMensagemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'mensagem' => $this->mensagem,
            'usuario' => [
                'id' => $this->usuario?->id,
                'nome' => $this->usuario?->nome,
            ],
            'anexos' => ChamadoAnexoResource::collection($this->whenLoaded('anexos')),
            'created_at' => $this->created_at,
        ];
    }
}
