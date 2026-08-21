<?php

namespace App\Http\Requests\Admin\AcessoSuporte;

use Illuminate\Foundation\Http\FormRequest;

class ListarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'por_pagina' => [
                'nullable',
                'integer',
                'min:1',
                'max:100',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'por_pagina.integer' => 'A quantidade por página deve ser um número inteiro',
            'por_pagina.min'     => 'A quantidade por página deve ser no mínimo 1',
            'por_pagina.max'     => 'A quantidade por página deve ser no máximo 100',
        ];
    }
}
