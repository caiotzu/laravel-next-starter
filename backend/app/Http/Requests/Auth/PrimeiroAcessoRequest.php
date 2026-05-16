<?php

namespace App\Http\Requests\Auth;

use Illuminate\Validation\Rules\Password;
use Illuminate\Foundation\Http\FormRequest;

class PrimeiroAcessoRequest extends FormRequest
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
            'senha' => [
                'required',
                'string',
                Password::min(8)
                    ->mixedCase()
                    ->letters()
                    ->numbers()
                    ->symbols(),
            ],
            'senha_confirma' => [
                'required',
                'string',
                'same:senha',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'token.required' => 'Token inválido.',

            'senha.required' => 'A senha é obrigatória.',
            'senha.min' => 'A senha deve ter pelo menos 8 caracteres.',
            'senha.mixed' => 'A senha deve conter pelo menos uma letra maiúscula e uma minúscula.',
            'senha.letters' => 'A senha deve conter pelo menos uma letra.',
            'senha.numbers' => 'A senha deve conter pelo menos um número.',
            'senha.symbols' => 'A senha deve conter pelo menos um caractere especial.',
            'senha_confirma.required' => 'A confirmação da senha é obrigatória.',
            'senha_confirma.same' => 'Senha de confirmação não confere.',
        ];
    }
}
