<?php

namespace App\Http\Requests\Admin\EmpresaEndereco;

use Illuminate\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;

use App\Models\EmpresaEndereco;

use App\Enums\EmpresaEnderecoTipo;


class CadastrarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'cep' => preg_replace('/\D/', '', $this->cep),
        ]);
    }

    public function rules(): array
    {
        return [
            'tipo' => [
                'required',
                Rule::in(
                    array_column(EmpresaEnderecoTipo::cases(), 'value')
                ),
            ],
            'municipio_id' => [
                'required',
                'uuid',
                'exists:municipios,id'
            ],
            'principal' => [
                'required',
                'boolean'
            ],
            'ativo' => [
                'required',
                'boolean'
            ],
            'cep' => [
                'required',
                'digits:8'
            ],
            'logradouro' => [
                'required',
                'string',
                'max:100'
            ],
            'numero' => [
                'required',
                'string',
                'max:5'
            ],
            'bairro' => [
                'required',
                'string',
                'max:100'
            ],
            'complemento' => [
                'nullable',
                'string',
                'max:50'
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'tipo.required' => 'O tipo do endereço é obrigatório.',
            'tipo.in' => 'O tipo do endereço deve ser ('. implode(', ', array_column(EmpresaEnderecoTipo::cases(), 'value')).')',

            'municipio_id.required' => 'O município é obrigatório.',
            'municipio_id.uuid' => 'O município deve ser um UUID válido.',
            'municipio_id.exists' => 'O município informado não existe.',

            'principal.required' => 'É necessário informar se o endereço é principal.',
            'principal.boolean' => 'O campo principal do endereço deve ser verdadeiro ou falso.',

            'ativo.required' => 'É necessário informar se o endereço é ativo.',
            'ativo.boolean' => 'O campo ativo do endereço deve ser verdadeiro ou falso.',

            'cep.required' => 'O CEP é obrigatório.',
            'cep.digits' => 'O CEP deve conter exatamente 8 números.',

            'logradouro.required' => 'O logradouro é obrigatório.',
            'logradouro.max' => 'O logradouro pode ter no máximo 100 caracteres.',

            'numero.required' => 'O número é obrigatório.',
            'numero.max' => 'O número pode ter no máximo 5 caracteres.',

            'bairro.required' => 'O bairro é obrigatório.',
            'bairro.max' => 'O bairro pode ter no máximo 100 caracteres.',

            'complemento.max' => 'O complemento pode ter no máximo 50 caracteres.',
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            if (!$this->boolean('principal')) {
                return;
            }

            $empresaId = $this->route('empresaId');

            $existePrincipal = EmpresaEndereco::query()
                ->where('empresa_id', $empresaId)
                ->where('principal', true)
                ->exists();

            if ($existePrincipal) {
                $validator->errors()->add(
                    'principal',
                    'Já existe um endereço principal para esta empresa.'
                );
            }
        });
    }
}
