<?php

namespace App\Http\Requests\Admin\EmpresaContato;

use Illuminate\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;

use App\Models\EmpresaContato;

use App\Enums\EmpresaContatoTipo;
class CadastrarRequest extends FormRequest
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
            if (!$this->boolean('principal')) {
                return;
            }

            $empresaId = $this->route('empresaId');
            $tipo = $this->input('tipo');

            $existePrincipal = EmpresaContato::query()
                ->where('empresa_id', $empresaId)
                ->where('tipo', $tipo)
                ->where('principal', true)
                ->exists();

            if ($existePrincipal) {
                $validator->errors()->add(
                    'principal',
                    'Já existe um contato principal deste tipo para esta empresa.'
                );
            }
        });
    }
}
