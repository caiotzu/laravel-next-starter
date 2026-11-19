<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class LoginSocialCallbackRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'codigo' => ['required', 'string', 'max:2048'],
            'state' => ['required', 'string', 'max:128'],
            'binding' => ['required', 'string', 'min:32', 'max:128'],
        ];
    }

    public function messages(): array
    {
        return [
            'codigo.required' => 'O código do provedor é obrigatório',
            'state.required' => 'O state é obrigatório',
            'binding.required' => 'O vínculo com o navegador é obrigatório',
            'binding.min' => 'O vínculo com o navegador é inválido',
        ];
    }
}
