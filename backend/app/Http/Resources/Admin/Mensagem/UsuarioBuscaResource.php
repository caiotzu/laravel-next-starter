<?php

namespace App\Http\Resources\Admin\Mensagem;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Versão enxuta do usuário (sem dados sensíveis/2FA/sessão), usada apenas
 * no autocomplete de seleção de destinatário no cadastro de mensagem.
 */
class UsuarioBuscaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nome' => $this->nome,
            'email' => $this->email,
        ];
    }
}
