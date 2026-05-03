<?php

namespace App\Http\Requests\Admin\Usuario;

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
                'exists:usuarios,id',
            ],
            'grupo_id' => [
                'nullable',
                'uuid',
                'exists:grupos,id',
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
            'id.uuid'   => 'O identificador do usuário informado não é um UUID válido',
            'id.exists' => 'O identificador do usuário informado não foi encontrado',

            'grupo_id.uuid'   => 'O identificador do grupo informado não é um UUID válido',
            'grupo_id.exists' => 'O identificador do grupo informado não foi encontrado',

            'nome.string' => 'A descrição do grupo deve ser um texto',
            'nome.max'    => 'A descrição do grupo deve ter no máximo 255 caracteres',

            'por_pagina.integer' => 'A quantidade por página deve ser um número inteiro',
            'por_pagina.min'     => 'A quantidade por página deve ser no mínimo 1',
            'por_pagina.max'     => 'A quantidade por página deve ser no máximo 100',

            'excluido.boolean' => 'O filtro excluído deve do tipo boolean',
        ];
    }
}
