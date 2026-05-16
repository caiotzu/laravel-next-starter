<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class PrimeiroAcessoValidarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'token' => [
                'required',
                'string',
            ],
        ];
    }

    public function messages(): array {
        return [
            'token.required' => 'O token é obrigatório',
            'token.string' => 'O token está com formato inválido',
        ];
    }
}
