<?php

namespace App\Http\Requests\Admin\Grupo;

use Illuminate\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;

class AtualizarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'descricao' => [
                'required',
                'string',
                'max:255',
                Rule::unique('grupos', 'descricao')->ignore($this->route('id')),
            ]
        ];
    }

    public function messages(): array {
        return [
            'descricao.required' => 'A descrição do grupo é obrigatória',
            'descricao.string'   => 'A descrição do grupo deve ser um texto',
            'descricao.max'      => 'A descrição do grupo deve ter no máximo 255 caracteres',
            'descricao.unique'   => 'A descrição do grupo já está cadastrado para outro grupo',
        ];
    }
}
