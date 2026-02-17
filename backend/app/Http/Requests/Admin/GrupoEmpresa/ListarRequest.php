<?php

namespace App\Http\Requests\Admin\GrupoEmpresa;

use Illuminate\Foundation\Http\FormRequest;

class ListarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('excluido')) {
            $this->merge([
                'excluido' => filter_var(
                    $this->excluido,
                    FILTER_VALIDATE_BOOLEAN,
                    FILTER_NULL_ON_FAILURE
                ),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'id' => [
                'nullable',
                'uuid',
                'exists:grupo_empresas,id',
            ],
            'nome' => [
                'nullable',
                'string',
                'max:255',
            ],
            'por_pagina' => [
                'nullable',
                'integer',
                'min:1',
                'max:100',
            ],
            'excluido' => [
                'nullable',
                'boolean'
            ],
        ];
    }

    public function messages(): array {
        return [
            'id.uuid'   => 'O identificador do grupo informado não é um UUID válido',
            'id.exists' => 'O identificador do grupo informado não foi encontrado',

            'nome.string' => 'O nome do grupo deve ser um texto',
            'nome.max'    => 'O nome do grupo deve ter no máximo 255 caracteres',

            'por_pagina.integer' => 'A quantidade por página deve ser um número inteiro',
            'por_pagina.min'     => 'A quantidade por página deve ser no mínimo 1',
            'por_pagina.max'     => 'A quantidade por página deve ser no máximo 100',

            'excluido.boolean' => 'O filtro excluído deve do tipo boolean',
        ];
    }
}
