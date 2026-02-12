<?php

namespace App\Http\Requests\Admin\GrupoEmpresa;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class CadastrarRequest extends FormRequest
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
                'unique:grupo_empresas,nome',
            ],
            'usuario.nome' => [
                'required',
                'string',
                'max:255',
            ],
            'usuario.email' => [
                'required',
                'email',
                'max:255',
                'unique:usuarios,email',
            ],
        ];
    }

    public function messages(): array {
        return [
            'nome.required' => 'O nome do grupo é obrigatório',
            'nome.string'   => 'O nome do grupo deve ser um texto',
            'nome.max'      => 'O nome do grupo deve ter no máximo 255 caracteres',
            'nome.unique'   => 'O nome do grupo já está cadastrado para outro grupo',


            'usuario.nome.required' => 'O nome do usuário é obrigatório',
            'usuario.nome.string'   => 'O nome do usuário deve ser um texto',
            'usuario.nome.max'      => 'O nome do usuário deve ter no máximo 255 caracteres',

            'usuario.email.required' => 'O e-mail do usuário é obrigatório',
            'usuario.email.email'    => 'O e-mail do usuário deve ser válido',
            'usuario.email.max'      => 'O e-mail do usuário deve ter no máximo 255 caracteres',
            'usuario.email.unique'   => 'O e-mail do usuário já está cadastrado',
        ];
    }
}
