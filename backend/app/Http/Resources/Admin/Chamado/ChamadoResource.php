<?php

namespace App\Http\Resources\Admin\Chamado;

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
            'prioridade' => $this->prioridade,
            'prioridade_label' => $this->prioridade->label(),
            'cliente' => [
                'id' => $this->whenLoaded('usuario', fn () => $this->usuario?->id),
                'nome' => $this->whenLoaded('usuario', fn () => $this->usuario?->nome),
                'email' => $this->whenLoaded('usuario', fn () => $this->usuario?->email),
            ],
            'responsavel' => $this->whenLoaded('responsavel', fn () => $this->responsavel ? [
                'id' => $this->responsavel->id,
                'nome' => $this->responsavel->nome,
            ] : null),
            'aberto_em' => $this->aberto_em,
            'fechado_em' => $this->fechado_em,
            'primeira_resposta_em' => $this->primeira_resposta_em,
            'ultima_interacao_em' => $this->ultima_interacao_em,
            'mensagens' => ChamadoMensagemResource::collection($this->whenLoaded('mensagens')),
        ];
    }
}
