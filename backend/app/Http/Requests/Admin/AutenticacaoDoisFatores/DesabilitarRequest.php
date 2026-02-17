<?php

namespace App\Http\Requests\Admin\AutenticacaoDoisFatores;

use Illuminate\Foundation\Http\FormRequest;

class DesabilitarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'senha'  => [
                'required',
                'string'
            ],
            'codigo' => [
                'required',
                'digits:6'
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'senha.required'  => 'A senha é obrigatória.',
            'senha.string'  => 'A senha deve ser uma string',

            'codigo.required' => 'O código é obrigatório.',
            'codigo.digits'   => 'O código deve conter 6 dígitos.',
        ];
    }
}
