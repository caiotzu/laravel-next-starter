<?php

namespace App\Http\Requests\Admin\Mensagem;

use Illuminate\Foundation\Http\FormRequest;

class BuscarUsuarioRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nome' => [
                'nullable',
                'string',
                'max:255',
            ],
            'por_pagina' => [
                'nullable',
                'integer',
                'min:1',
                'max:50',
            ],
        ];
    }

    public function messages(): array {
        return [
            'nome.string' => 'O nome deve ser um texto',
            'nome.max'    => 'O nome deve ter no máximo 255 caracteres',

            'por_pagina.integer' => 'A quantidade por página deve ser um número inteiro',
            'por_pagina.min'     => 'A quantidade por página deve ser no mínimo 1',
            'por_pagina.max'     => 'A quantidade por página deve ser no máximo 50',
        ];
    }
}
