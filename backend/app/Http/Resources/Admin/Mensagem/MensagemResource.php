<?php

namespace App\Http\Resources\Admin\Mensagem;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MensagemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'titulo' => $this->titulo,
            'conteudo' => $this->conteudo,
            'origem' => $this->origem,
            'remetente' => $this->whenLoaded('remetente', fn () => $this->remetente ? [
                'id' => $this->remetente->id,
                'nome' => $this->remetente->nome,
            ] : null),
            'direcionamento' => MensagemDirecionamentoResource::make(
                $this->whenLoaded('direcionamento')
            ),
            'total_destinatarios' => $this->whenCounted('destinatarios'),
            'total_lidos' => $this->whenCounted('destinatarios_lidos_count'),
            'updated_at' => $this->updated_at,
            'created_at' => $this->created_at,
            'deleted_at' => $this->deleted_at,
        ];
    }
}
