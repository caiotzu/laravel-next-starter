<?php

namespace App\Http\Resources\Global\Mensagem;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Representa a mensagem do ponto de vista do destinatário (usuário
 * autenticado): o `id` exposto é o do destinatário (`mensagem_destinatarios`),
 * usado para as ações de marcar como lida.
 */
class MensagemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'mensagem_id' => $this->mensagem_id,
            'titulo' => $this->mensagem?->titulo,
            'conteudo' => $this->mensagem?->conteudo,
            'origem' => $this->mensagem?->origem,
            'lida' => ! is_null($this->lida_em),
            'lida_em' => $this->lida_em,
            'created_at' => $this->created_at,
        ];
    }
}
