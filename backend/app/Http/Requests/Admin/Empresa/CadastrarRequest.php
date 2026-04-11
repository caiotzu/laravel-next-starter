<?php

namespace App\Http\Requests\Admin\Empresa;

use Illuminate\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;

use App\Enums\UF;


class CadastrarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->cnpj) {
            $this->merge([
                'cnpj' => preg_replace('/[^a-zA-Z0-9]+/', '', $this->cnpj),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'grupo_empresa_id' => [
                'required',
                'uuid',
                'exists:grupo_empresas,id'
            ],
            'matriz_id' => [
                'nullable',
                'uuid',
                'exists:empresas,id'
            ],
            'cnpj' => [
                'required',
                'size:14',
                'unique:empresas,cnpj'
            ],
            'nome_fantasia' => [
                'required',
                'string',
                'max:60'
            ],
            'razao_social' => [
                'required',
                'string',
                'max:60'
            ],
            'inscricao_estadual' => [
                'nullable',
                'string'
            ],
            'inscricao_municipal' => [
                'nullable',
                'string'
            ],
            'uf' => [
                'required',
                'string',
                'size:2',
                Rule::in(
                    array_column(UF::cases(), 'value')
                ),
            ]
        ];
    }

    public function messages(): array
    {
        return [
            'grupo_empresa_id.required' => 'O grupo da empresa é obrigatório.',
            'grupo_empresa_id.uuid' => 'O grupo da empresa deve ser um UUID válido.',
            'grupo_empresa_id.exists' => 'O grupo da empresa informado não existe.',

            'matriz_id.uuid' => 'A matriz deve ser um UUID válido.',
            'matriz_id.exists' => 'A matriz informada não existe.',

            'cnpj.required' => 'O CNPJ é obrigatório.',
            'cnpj.size' => 'O CNPJ deve conter exatamente 14 caracteres.',
            'cnpj.unique' => 'Já existe uma empresa cadastrada com este CNPJ.',

            'nome_fantasia.required' => 'O nome fantasia é obrigatório.',
            'nome_fantasia.max' => 'O nome fantasia pode ter no máximo 60 caracteres.',

            'razao_social.required' => 'A razão social é obrigatória.',
            'razao_social.max' => 'A razão social pode ter no máximo 60 caracteres.',

            'uf.required' => 'A UF é obrigatória.',
            'uf.size' => 'A UF deve conter exatamente 2 caracteres.',
            'uf.in' => 'A UF informada é inválida'
        ];
    }
}
