<?php

namespace App\Http\Requests\Admin\GrupoEmpresa;

use Illuminate\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class AtualizarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nome' => [
                'required',
                'string',
                'max:255',
                Rule::unique('grupo_empresas', 'nome')->ignore($this->route('id')),
            ]
        ];
    }

    public function messages(): array {
        return [
            'nome.required' => 'O nome do grupo é obrigatório',
            'nome.string'   => 'O nome do grupo deve ser um texto',
            'nome.max'      => 'O nome do grupo deve ter no máximo 255 caracteres',
            'nome.unique'   => 'O nome do grupo já está cadastrado para outro grupo',
        ];
    }
}
