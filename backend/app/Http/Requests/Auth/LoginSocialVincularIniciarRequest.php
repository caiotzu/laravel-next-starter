<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class LoginSocialVincularIniciarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // A senha é conferida no AutenticacaoSocialService (com limite de tentativas).
            'senha' => ['required', 'string'],
            'binding' => ['required', 'string', 'min:32', 'max:128'],
        ];
    }

    public function messages(): array
    {
        return [
            'senha.required' => 'A senha é obrigatória.',
            'senha.string' => 'A senha deve ser uma string',
            'binding.required' => 'O vínculo com o navegador é obrigatório',
            'binding.min' => 'O vínculo com o navegador é inválido',
            'binding.max' => 'O vínculo com o navegador é inválido',
        ];
    }
}
