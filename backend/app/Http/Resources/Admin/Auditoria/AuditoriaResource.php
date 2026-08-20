<?php

namespace App\Http\Resources\Admin\Auditoria;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuditoriaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'entidade_tabela' => $this->entidade_tabela,
            'entidade_id' => $this->entidade_id,
            'registro' => $this->registro ?? null,
            'agrupador_tabela' => $this->agrupador_tabela,
            'agrupador_id' => $this->agrupador_id,
            'acao' => $this->acao,
            'origem' => $this->origem,
            'dados_antes' => $this->dados_antes,
            'dados_depois' => $this->dados_depois,
            'campos_alterados' => $this->campos_alterados,
            'ip' => $this->ip,
            'user_agent' => $this->user_agent,
            'criado_em' => $this->criado_em,
            'acesso_suporte_id' => $this->acesso_suporte_id,
            'usuario' => $this->whenLoaded('usuario', fn () => [
                'id' => $this->usuario->id,
                'nome' => $this->usuario->nome,
                'email' => $this->usuario->email,
            ]),
        ];
    }
}
