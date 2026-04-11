<?php

namespace App\Http\Resources\EmpresaEndereco;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

use App\Http\Resources\Municipio\MunicipioResource;

class EmpresaEnderecoResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'empresa_id' => $this->empresa_id,
            'tipo' => $this->tipo->value,
            'tipo_descricao' => $this->tipo->label(),
            'municipio_id' => $this->municipio_id,
            'ativo' => $this->ativo,
            'principal' => $this->principal,
            'cep' => $this->cep,
            'logradouro' => $this->logradouro,
            'numero' => $this->numero,
            'bairro' => $this->bairro,
            'complemento' => $this->complemento,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'deleted_at' => $this->deleted_at,
            'municipio' => MunicipioResource::make(
                $this->whenLoaded('municipio')
            )
        ];
    }
}
