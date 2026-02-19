<?php

namespace App\Http\Requests\Admin\AutenticacaoDoisFatores;

use Illuminate\Foundation\Http\FormRequest;

class HabilitarRequest extends FormRequest
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
        ];
    }

    public function messages(): array
    {
        return [
            'senha.required'  => 'A senha é obrigatória.',
            'senha.string'  => 'A senha deve ser uma string'
        ];
    }
}
