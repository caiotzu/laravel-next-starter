<?php

namespace App\Http\Requests\Admin\AutenticacaoDoisFatores;

use Illuminate\Foundation\Http\FormRequest;

class ConfirmarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'codigo' => [
                'required',
                'digits:6'
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'codigo.required' => 'O código é obrigatório.',
            'codigo.digits' => 'O código deve conter 6 dígitos.',
        ];
    }
}
