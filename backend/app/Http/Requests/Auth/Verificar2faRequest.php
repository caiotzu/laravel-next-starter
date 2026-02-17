<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class Verificar2faRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
           'temp_token' => [
                'required',
                'string'
            ],
            'codigo' => [
                'required',
                'digits:6'
            ],
        ];
    }

    public function messages(): array {
        return [
            'temp_token.required' => 'O token temporário é obrigatório',
            'temp_token.string' => 'O token temporário deve ser uma string',

            'codigo.required' => 'O código é obrigatório',
            'codigo.digits' => 'O código deve conter 6 dígitos'
        ];
    }
}
