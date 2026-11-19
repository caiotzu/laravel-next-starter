<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class LoginSocialIniciarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Valor aleatório gerado pelo BFF e guardado em cookie httpOnly do navegador.
            'binding' => ['required', 'string', 'min:32', 'max:128'],
        ];
    }

    public function messages(): array
    {
        return [
            'binding.required' => 'O vínculo com o navegador é obrigatório',
            'binding.min' => 'O vínculo com o navegador é inválido',
            'binding.max' => 'O vínculo com o navegador é inválido',
        ];
    }
}
