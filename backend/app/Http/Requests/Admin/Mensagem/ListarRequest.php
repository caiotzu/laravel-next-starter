<?php

namespace App\Http\Requests\Admin\Mensagem;

use Illuminate\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;

use App\Enums\MensagemOrigem;

class ListarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id' => [
                'nullable',
                'uuid',
                Rule::exists('mensagens', 'id'),
            ],
            'titulo' => [
                'nullable',
                'string',
                'max:120',
            ],
            'origem' => [
                'nullable',
                Rule::enum(MensagemOrigem::class),
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
            'id.uuid'   => 'O identificador da mensagem informado não é um UUID válido',
            'id.exists' => 'O identificador da mensagem informado não foi encontrado',

            'titulo.string' => 'O título deve ser um texto',
            'titulo.max'    => 'O título deve ter no máximo 120 caracteres',

            'origem.enum' => 'A origem informada é inválida',

            'por_pagina.integer' => 'A quantidade por página deve ser um número inteiro',
            'por_pagina.min'     => 'A quantidade por página deve ser no mínimo 1',
            'por_pagina.max'     => 'A quantidade por página deve ser no máximo 100',
        ];
    }
}
