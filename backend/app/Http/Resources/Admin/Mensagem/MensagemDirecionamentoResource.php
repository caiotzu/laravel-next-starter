<?php

namespace App\Http\Resources\Admin\Mensagem;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MensagemDirecionamentoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'tipo' => $this->tipo,
            'entidade_tipo' => $this->whenLoaded('entidadeTipo', fn () => $this->entidadeTipo?->chave->value),
            'grupo_empresa_id' => $this->grupo_empresa_id,
            'grupo_empresa_nome' => $this->whenLoaded('grupoEmpresa', fn () => $this->grupoEmpresa?->nome),
            'usuario_id' => $this->usuario_id,
            'usuario_nome' => $this->whenLoaded('usuario', fn () => $this->usuario?->nome),
        ];
    }
}
