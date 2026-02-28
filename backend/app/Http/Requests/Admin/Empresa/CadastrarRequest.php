<?php

namespace App\Http\Requests\Admin\Empresa;

use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

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

        if ($this->enderecos) {
            $enderecos = collect($this->enderecos)->map(function ($endereco) {
                $endereco['cep'] = isset($endereco['cep'])
                    ? preg_replace('/\D/', '', $endereco['cep'])
                    : null;

                return $endereco;
            });

            $this->merge(['enderecos' => $enderecos->toArray()]);
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
                Rule::in([
                    'AC','AL','AP','AM','BA','CE','DF','ES','GO',
                    'MA','MT','MS','MG','PA','PB','PR','PE','PI',
                    'RJ','RN','RS','RO','RR','SC','SP','SE','TO'
                ]),
            ],
            'enderecos' => [
                'required',
                'array',
                'min:1'
            ],
            'enderecos.*.tipo' => [
                'required',
                Rule::in([
                    'COMERCIAL',
                    'FISCAL',
                    'CORRESPONDENCIA',
                    'COBRANCA',
                    'ENTREGA',
                ])
            ],
            'enderecos.*.municipio_id' => [
                'required',
                'uuid',
                'exists:municipios,id'
            ],
            'enderecos.*.principal' => [
                'required',
                'boolean'
            ],
            'enderecos.*.ativo' => [
                'required',
                'boolean'
            ],
            'enderecos.*.cep' => [
                'required',
                'digits:8'
            ],
            'enderecos.*.logradouro' => [
                'required',
                'string',
                'max:100'
            ],
            'enderecos.*.numero' => [
                'required',
                'string',
                'max:5'
            ],
            'enderecos.*.bairro' => [
                'required',
                'string',
                'max:100'
            ],
            'enderecos.*.complemento' => [
                'nullable',
                'string',
                'max:50'
            ],
            'contatos' => [
                'required',
                'array',
                'min:1'
            ],
            'contatos.*.tipo' => [
                'required',
                Rule::in(['T', 'E'])
            ],
            'contatos.*.valor' => [
                'required',
                'string',
                'max:100'
            ],
            'contatos.*.principal' => [
                'required',
                'boolean'
            ],
            'contatos.*.ativo' => [
                'required',
                'boolean'
            ],
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
            'uf.in' => 'A UF informada é inválida',

            'enderecos.required' => 'É obrigatório informar pelo menos um endereço.',
            'enderecos.array' => 'O campo endereços deve ser uma lista.',
            'enderecos.min' => 'É necessário informar ao menos um endereço.',

            'enderecos.*.tipo.required' => 'O tipo do endereço é obrigatório.',
            'enderecos.*.tipo.in' => 'O tipo do endereço informado é inválido.',

            'enderecos.*.municipio_id.required' => 'O município é obrigatório.',
            'enderecos.*.municipio_id.uuid' => 'O município deve ser um UUID válido.',
            'enderecos.*.municipio_id.exists' => 'O município informado não existe.',

            'enderecos.*.principal.required' => 'É necessário informar se o endereço é principal.',
            'enderecos.*.principal.boolean' => 'O campo principal do endereço deve ser verdadeiro ou falso.',

            'enderecos.*.ativo.required' => 'É necessário informar se o endereço é ativo.',
            'enderecos.*.ativo.boolean' => 'O campo ativo do endereço deve ser verdadeiro ou falso.',

            'enderecos.*.cep.required' => 'O CEP é obrigatório.',
            'enderecos.*.cep.digits' => 'O CEP deve conter exatamente 8 números.',

            'enderecos.*.logradouro.required' => 'O logradouro é obrigatório.',
            'enderecos.*.logradouro.max' => 'O logradouro pode ter no máximo 100 caracteres.',

            'enderecos.*.numero.required' => 'O número é obrigatório.',
            'enderecos.*.numero.max' => 'O número pode ter no máximo 5 caracteres.',

            'enderecos.*.bairro.required' => 'O bairro é obrigatório.',
            'enderecos.*.bairro.max' => 'O bairro pode ter no máximo 100 caracteres.',

            'enderecos.*.complemento.max' => 'O complemento pode ter no máximo 50 caracteres.',

            'contatos.required' => 'É obrigatório informar pelo menos um contato.',
            'contatos.array' => 'O campo contatos deve ser uma lista.',
            'contatos.min' => 'É necessário informar ao menos um contato.',

            'contatos.*.tipo.required' => 'O tipo do contato é obrigatório.',
            'contatos.*.tipo.in' => 'O tipo do contato deve ser T (Telefone) ou E (E-mail).',

            'contatos.*.valor.required' => 'O valor do contato é obrigatório.',
            'contatos.*.valor.max' => 'O valor do contato pode ter no máximo 100 caracteres.',

            'contatos.*.principal.required' => 'É necessário informar se o contato é principal.',
            'contatos.*.principal.boolean' => 'O campo principal do contato deve ser verdadeiro ou falso.',

            'contatos.*.ativo.required' => 'É necessário informar se o contato é ativo.',
            'contatos.*.ativo.boolean' => 'O campo ativo do contato deve ser verdadeiro ou falso.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            $enderecosPrincipais = collect($this->enderecos)
                ->where('principal', true)
                ->count();

            if ($enderecosPrincipais !== 1) {
                $validator->errors()->add(
                    'enderecos',
                    'Deve existir exatamente 1 endereço principal.'
                );
            }

            $contatos = collect($this->contatos);

            $emailPrincipal = $contatos
                ->where('tipo', 'E')
                ->where('principal', true)
                ->count();

            $telefonePrincipal = $contatos
                ->where('tipo', 'T')
                ->where('principal', true)
                ->count();

            if ($emailPrincipal < 1) {
                $validator->errors()->add(
                    'contatos',
                    'Deve existir pelo menos 1 e-mail principal.'
                );
            }

            if ($telefonePrincipal < 1) {
                $validator->errors()->add(
                    'contatos',
                    'Deve existir pelo menos 1 telefone principal.'
                );
            }
        });
    }
}
