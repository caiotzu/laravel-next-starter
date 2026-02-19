<?php

namespace App\Http\Requests\Admin\Perfil;

use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth;
use Illuminate\Foundation\Http\FormRequest;

class AtualizarRequest extends FormRequest
{
    public function rules(): array
    {
        /** @var \App\Models\Usuario $user */
        $user = Auth::user();

        return [
            'nome' => [
                'sometimes',
                'string',
                'max:255',
            ],
            'email' => [
                'sometimes',
                'email',
                'max:255',
                Rule::unique('usuarios', 'email')
                    ->ignore($user->id)
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'nome.string' => 'O nome deve ser um texto.',
            'nome.max' => 'O nome deve ter no máximo 255 caracteres.',

            'email.email' => 'O e-mail informado não é válido.',
            'email.max' => 'O e-mail deve ter no máximo 255 caracteres.',
            'email.unique' => 'Este e-mail já está cadastrado para outro usuário.',
        ];
    }
}
