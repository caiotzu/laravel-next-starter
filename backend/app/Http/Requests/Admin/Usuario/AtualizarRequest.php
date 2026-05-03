<?php

namespace App\Http\Requests\Admin\Usuario;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AtualizarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'grupo_id' => [
                'required',
                'uuid',
                Rule::exists('grupos', 'id')
            ],
            'nome' => [
                'required',
                'string',
                'max:255'
            ],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('usuarios', 'email')->ignore($this->route('id')),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'grupo_id.required' => 'O grupo é obrigatório',
            'grupo_id.uuid'     => 'O grupo informado é inválido',
            'grupo_id.exists'   => 'O grupo informado não existe',

            'nome.required' => 'O nome é obrigatório',
            'nome.string'   => 'O nome deve ser um texto',
            'nome.max'      => 'O nome deve ter no máximo 255 caracteres',

            'email.required' => 'O e-mail é obrigatório',
            'email.email'    => 'O e-mail informado é inválido',
            'email.max'      => 'O e-mail deve ter no máximo 255 caracteres',
            'email.unique'   => 'Já existe um usuário com este e-mail',
        ];
    }
}
