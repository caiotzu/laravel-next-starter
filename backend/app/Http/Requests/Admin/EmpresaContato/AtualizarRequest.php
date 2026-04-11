<?php

namespace App\Http\Requests\Admin\EmpresaContato;

use Illuminate\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;

use App\Models\EmpresaContato;

use App\Enums\EmpresaContatoTipo;


class AtualizarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tipo' => [
                'required',
                Rule::in(
                    array_column(EmpresaContatoTipo::cases(), 'value')
                ),
            ],
            'valor' => [
                'required',
                'string',
                'max:100'
            ],
            'principal' => [
                'required',
                'boolean'
            ],
            'ativo' => [
                'required',
                'boolean'
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'tipo.required' => 'O tipo do contato é obrigatório.',
            'tipo.in' => 'O tipo do contato deve ser ('. implode(', ', array_column(EmpresaContatoTipo::cases(), 'value')).')',

            'valor.required' => 'O valor do contato é obrigatório.',
            'valor.max' => 'O valor do contato pode ter no máximo 100 caracteres.',

            'principal.required' => 'É necessário informar se o contato é principal.',
            'principal.boolean' => 'O campo principal do contato deve ser verdadeiro ou falso.',

            'ativo.required' => 'É necessário informar se o contato é ativo.',
            'ativo.boolean' => 'O campo ativo do contato deve ser verdadeiro ou falso.',
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {

            $empresaId = $this->route('empresaId');
            $contatoId = $this->route('contatoId');

            $contato = EmpresaContato::query()
                ->where('id', $contatoId)
                ->where('empresa_id', $empresaId)
                ->first();

            if (!$contato) {
                $validator->errors()->add(
                    'contato',
                    'O contato informado não pertence à empresa.'
                );

                return;
            }

            if (!$this->boolean('principal')) {
                return;
            }

            $tipo = $this->input('tipo');

            $existeOutroPrincipal = EmpresaContato::query()
                ->where('empresa_id', $empresaId)
                ->where('tipo', $tipo)
                ->where('principal', true)
                ->where('id', '!=', $contatoId)
                ->exists();

            if ($existeOutroPrincipal) {
                $validator->errors()->add(
                    'principal',
                    'Já existe um contato principal deste tipo para esta empresa.'
                );
            }
        });
    }
}
