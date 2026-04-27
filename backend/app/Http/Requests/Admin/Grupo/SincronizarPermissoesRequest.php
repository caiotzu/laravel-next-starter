<?php

namespace App\Http\Requests\Admin\Grupo;

use Illuminate\Foundation\Http\FormRequest;

class SincronizarPermissoesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'permissoes'   => [
                'required',
                'array',
                'min:1'
            ],
            'permissoes.*' => [
                'required',
                'uuid',
                'exists:permissoes,id'
            ],
        ];
    }

    public function messages(): array {
        return [
            'permissoes.required'   => 'É obrigatório informar as permissões.',
            'permissoes.array'      => 'As permissões devem ser informadas como array',
            'permissoes.min'        => 'É necessário o usuário ter ao menos uma permissão',

            'permissoes.*.required' => 'O identificador da permissão não pode estar vazio.',
            'permissoes.*.uuid'     => 'O formato da permissão enviada é inválido.',
            'permissoes.*.exists'   => 'Uma ou mais permissões selecionadas não existem no sistema.',
        ];
    }
}
