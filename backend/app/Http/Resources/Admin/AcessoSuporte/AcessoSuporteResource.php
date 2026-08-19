<?php

namespace App\Http\Resources\Admin\AcessoSuporte;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AcessoSuporteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $entidade = $this->entidade();

        return [
            'id' => $this->id,
            'status' => $this->status,
            'entidade' => [
                'tipo' => $this->entidadeTipo?->chave->value,
                'id' => $this->entidade_id,
                'nome' => $entidade?->nome,
            ],
            'concedido_por' => [
                'id' => $this->concedente?->id,
                'nome' => $this->concedente?->nome,
                'email' => $this->concedente?->email,
            ],
            'motivo' => $this->motivo,
            'iniciado_em' => $this->iniciado_em,
            'expira_em' => $this->expira_em,
            'encerrado_em' => $this->encerrado_em,
            'encerrado_por' => $this->encerrado_por,
            'ativo' => $this->estaValido(),
            'created_at' => $this->created_at,
        ];
    }
}
