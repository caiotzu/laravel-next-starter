<?php

namespace App\Http\Requests\Auth;

use Illuminate\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => [
                'required',
                'email',
                Rule::exists('usuarios', 'email')
            ],
            'senha' => 'required'
        ];
    }

    public function messages(): array {
        return [
            'email.required' => 'O e-mail é obrigatório',
            'email.email' => 'O e-mail está com formato inválido',
            'email.exists' => 'O e-mail não foi encontrado',

            'senha.required' => 'A senha é obrigatória',
        ];
    }
}
