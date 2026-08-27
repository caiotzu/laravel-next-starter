<?php

namespace App\Http\Resources\Private\Chamado;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChamadoAnexoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nome_original' => $this->nome_original,
            'url' => $this->caminho,
            'mime_type' => $this->mime_type,
            'tamanho' => $this->tamanho,
        ];
    }
}
