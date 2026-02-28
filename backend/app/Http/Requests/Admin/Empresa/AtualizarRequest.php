<?php

namespace App\Http\Requests\Admin\Empresa;

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
            'matriz_id' => [
                'required',
                'uuid',
                'exists:empresas,id',
            ],
            'cnpj' => [
                'required',
                'string',
                'size:14',
                Rule::unique('empresas', 'cnpj')
                    ->ignore($this->route('id')),
            ],
            'nome_fantasia' => [
                'required',
                'string',
                'max:60',
            ],
            'razao_social' => [
                'required',
                'string',
                'max:60',
            ],
            'inscricao_estadual' => [
                'nullable',
                'string',
                'max:255',
            ],
            'inscricao_municipal' => [
                'nullable',
                'string',
                'max:255',
            ],
            'uf' => [
                'required',
                'string',
                Rule::in([
                    'AC','AL','AP','AM','BA','CE','DF','ES','GO',
                    'MA','MT','MS','MG','PA','PB','PR','PE','PI',
                    'RJ','RN','RS','RO','RR','SC','SP','SE','TO'
                ]),
            ],

            'ativo' => [
                'required',
                'boolean',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'matriz_id.required' => 'A matriz é obrigatória.',
            'matriz_id.uuid' => 'O ID da matriz deve ser um UUID válido.',
            'matriz_id.exists' => 'A empresa informada como matriz não existe.',

            'cnpj.required' => 'O CNPJ é obrigatório.',
            'cnpj.size' => 'O CNPJ deve conter 14 caracteres.',
            'cnpj.unique' => 'Já existe uma empresa cadastrada com este CNPJ.',

            'nome_fantasia.required' => 'O nome fantasia é obrigatório.',
            'nome_fantasia.max' => 'O nome fantasia deve ter no máximo 60 caracteres.',

            'razao_social.required' => 'A razão social é obrigatória.',
            'razao_social.max' => 'A razão social deve ter no máximo 60 caracteres.',

            'inscricao_estadual.max' => 'A inscrição estadual deve ter no máximo 255 caracteres.',

            'inscricao_municipal.max' => 'A inscrição municipal deve ter no máximo 255 caracteres.',

            'uf.required' => 'A UF é obrigatória.',
            'uf.in' => 'A UF informada é inválida.',

            'ativo.required' => 'O campo ativo é obrigatório.',
            'ativo.boolean' => 'O campo ativo deve ser verdadeiro ou falso.',
        ];
    }
}
