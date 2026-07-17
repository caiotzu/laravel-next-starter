<?php

namespace App\Http\Requests\Admin\Usuario;

use App\Enums\UsuarioStatus;
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
            'status' => [
                'nullable',
                Rule::in([
                    UsuarioStatus::ATIVO->value,
                    UsuarioStatus::INATIVO->value,
                    UsuarioStatus::BLOQUEADO->value,
                ]),
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

            'status.in' => 'O status/situação deve ser ('.UsuarioStatus::ATIVO->value.','.UsuarioStatus::INATIVO->value.','.UsuarioStatus::BLOQUEADO->value.')',
        ];
    }
}
