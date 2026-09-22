<?php

namespace App\Http\Requests\Private\Perfil;

use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
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
            // Só é exigida (e validada em withValidator) quando o e-mail está sendo alterado.
            'senha_atual' => [
                'sometimes',
                'nullable',
                'string',
            ],
        ];
    }

    /**
     * Trocar o e-mail é a etapa que transforma uma sessão comprometida em tomada de conta
     * permanente (basta pedir "esqueci a senha" para o novo e-mail). Por isso exige
     * reautenticação com a senha atual, mesma regra usada para trocar a senha.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            /** @var \App\Models\Usuario|null $user */
            $user = Auth::user();

            if (! $user || ! $this->filled('email')) {
                return;
            }

            if (Str::lower((string) $this->input('email')) === Str::lower((string) $user->email)) {
                return;
            }

            $senhaAtual = $this->input('senha_atual');

            if (! is_string($senhaAtual) || $senhaAtual === '') {
                $validator->errors()->add('senha_atual', 'Informe a senha atual para alterar o e-mail.');
                return;
            }

            if (! Hash::check($senhaAtual, (string) $user->senha)) {
                $validator->errors()->add('senha_atual', 'A senha atual está incorreta.');
            }
        });
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
