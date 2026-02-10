<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

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
                'exists:usuarios'
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
