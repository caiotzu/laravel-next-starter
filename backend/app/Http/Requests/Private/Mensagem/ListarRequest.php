<?php

namespace App\Http\Requests\Private\Mensagem;

use Illuminate\Foundation\Http\FormRequest;

class ListarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('lida')) {
            $this->merge([
                'lida' => filter_var(
                    $this->lida,
                    FILTER_VALIDATE_BOOLEAN,
                    FILTER_NULL_ON_FAILURE
                ),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'lida' => [
                'nullable',
                'boolean',
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
            'lida.boolean' => 'O filtro de lida deve ser do tipo boolean',

            'por_pagina.integer' => 'A quantidade por página deve ser um número inteiro',
            'por_pagina.min'     => 'A quantidade por página deve ser no mínimo 1',
            'por_pagina.max'     => 'A quantidade por página deve ser no máximo 100',
        ];
    }
}
