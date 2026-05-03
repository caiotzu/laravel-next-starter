<?php

namespace App\Http\Resources\Admin\Empresa;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EmpresaResource extends JsonResource
{

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'grupo_empresa_id' => $this->grupo_empresa_id,
            'matriz_id' => $this->matriz_id,
            'cnpj' => $this->cnpj,
            'nome_fantasia' => $this->nome_fantasia,
            'razao_social' => $this->razao_social,
            'inscricao_estadual' => $this->inscricao_estadual,
            'inscricao_municipal' => $this->inscricao_municipal,
            'status' => $this->status->value,
            'status_descricao' => $this->status->label(),
            'uf' => $this->uf,
            'updated_at' => $this->updated_at,
            'created_at' => $this->created_at,
            'deleted_at' => $this->deleted_at
        ];
    }
}
