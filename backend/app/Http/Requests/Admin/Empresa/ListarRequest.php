<?php

namespace App\Http\Requests\Admin\Empresa;

use Illuminate\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;

use App\Enums\UF;

class ListarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $dados = [];

        if ($this->exists('excluido')) {
            $dados['excluido'] = $this->normalizarBoolean($this->input('excluido'));
        }

        if ($this->exists('ativo')) {
            $dados['ativo'] = $this->normalizarBoolean($this->input('ativo'));
        }

        if (! empty($dados)) {
            $this->merge($dados);
        }
    }

    private function normalizarBoolean(mixed $valor): ?bool
    {
        if ($valor === '' || $valor === null) {
            return null;
        }

        return filter_var(
            $valor,
            FILTER_VALIDATE_BOOLEAN,
            FILTER_NULL_ON_FAILURE
        );
    }

    public function rules(): array
    {
        return [
            'id' => [
                'nullable',
                'uuid',
                'exists:empresas,id',
            ],
            'grupo_empresa_id' => [
                'nullable',
                'uuid',
                'exists:grupo_empresas,id',
            ],
            'matriz_id' => [
                'nullable',
                'uuid',
                'exists:empresas,id',
            ],
            'cnpj' => [
                'nullable',
                'size:14',
                'exists:empresas,cnpj'
            ],
            'nome_fantasia' => [
                'nullable',
                'string',
                'max:60',
            ],
            'razao_social' => [
                'nullable',
                'string',
                'max:60',
            ],
            'inscricao_estadual' => [
                'nullable',
                'string'
            ],
            'inscricao_municipal' => [
                'nullable',
                'string'
            ],
            'ativo' => [
                'nullable',
                'boolean'
            ],
            'uf' => [
                'nullable',
                'string',
                'size:2',
                Rule::in(
                    array_column(UF::cases(), 'value')
                ),
            ],
            'excluido' => [
                'nullable',
                'boolean'
            ],
            'por_pagina' => [
                'nullable',
                'integer',
                'min:1',
                'max:100',
            ],
        ];
    }

    public function messages(): array {
        return [
            'id.uuid'   => 'O identificador da empresa informado não é um UUID válido',
            'id.exists' => 'O identificador da empresa informado não foi encontrado',

            'grupo_empresa_id.uuid'   => 'O identificador do grupo empresa informado não é um UUID válido',
            'grupo_empresa_id.exists' => 'O identificador do grupo empresa informado não foi encontrado',

            'matriz_id.uuid'   => 'O identificador da matriz informado não é um UUID válido',
            'matriz_id.exists' => 'O identificador da matriz informado não foi encontrado',

            'cnpj.size' => 'O CNPJ deve conter exatamente 14 caracteres.',
            'cnpj.exists' => 'O CNPJ não foi encontrado.',

            'nome_fantasia.string' => 'O nome fantasia da empresa deve ser um texto',
            'nome_fantasia.max'    => 'O nome fantasia da empresa deve ter no máximo 60 caracteres',

            'razao_social.string' => 'A razão social da empresa deve ser um texto',
            'razao_social.max'    => 'A razão social da empresa deve ter no máximo 60 caracteres',

            'ativo.boolean' => 'O filtro ativo deve do tipo boolean',

            'uf.size' => 'A UF deve conter exatamente 2 caracteres.',
            'uf.in' => 'A UF informada é inválida',

            'excluido.boolean' => 'O filtro excluído deve do tipo boolean',

            'por_pagina.integer' => 'A quantidade por página deve ser um número inteiro',
            'por_pagina.min'     => 'A quantidade por página deve ser no mínimo 1',
            'por_pagina.max'     => 'A quantidade por página deve ser no máximo 100',
        ];
    }
}
