<?php

namespace App\Http\Resources\Private\Chamado;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChamadoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'ticket' => $this->ticket,
            'assunto' => $this->assunto,
            'tipo' => $this->tipo,
            'tipo_label' => $this->tipo->label(),
            'status' => $this->status,
            'status_label' => $this->status->label(),
            'aberto_em' => $this->aberto_em,
            'fechado_em' => $this->fechado_em,
            'ultima_interacao_em' => $this->ultima_interacao_em,
            'mensagens' => ChamadoMensagemResource::collection($this->whenLoaded('mensagens')),
        ];
    }
}
