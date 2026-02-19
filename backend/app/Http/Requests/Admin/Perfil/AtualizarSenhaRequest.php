<?php

namespace App\Http\Requests\Admin\Perfil;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Foundation\Http\FormRequest;

class AtualizarSenhaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'senha_atual' => [
                'required',
                'string',
            ],

            'senha_nova' => [
                'required',
                'string',
                'different:senha_atual',
                Password::min(8)
                    ->mixedCase()
                    ->letters()
                    ->numbers()
                    ->symbols(),
            ],

            'senha_nova_confirma' => [
                'required',
                'string',
                'same:senha_nova',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'senha_atual.required' => 'A senha atual é obrigatória.',
            'senha_nova.required' => 'A nova senha é obrigatória.',
            'senha_nova.different' => 'A nova senha deve ser diferente da senha atual.',

            'senha_nova.min' => 'A nova senha deve ter pelo menos 8 caracteres.',
            'senha_nova.mixed' => 'A nova senha deve conter pelo menos uma letra maiúscula e uma minúscula.',
            'senha_nova.letters' => 'A nova senha deve conter pelo menos uma letra.',
            'senha_nova.numbers' => 'A nova senha deve conter pelo menos um número.',
            'senha_nova.symbols' => 'A nova senha deve conter pelo menos um caractere especial.',

            'senha_nova_confirma.required' => 'A confirmação da senha é obrigatória.',
            'senha_nova_confirma.same' => 'Senha de confirmação não confere.',
        ];
    }

    protected function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $usuario = Auth::user();

            if (! $usuario || ! Hash::check($this->senha_atual, $usuario->senha)) {
                $validator->errors()->add('senha_atual', 'A senha atual está incorreta.');
            }
        });
    }
}
