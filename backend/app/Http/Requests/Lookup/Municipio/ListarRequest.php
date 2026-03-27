<?php

namespace App\Http\Requests\Lookup\Municipio;

use Illuminate\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;

class ListarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->nome) {
            $this->merge([
                'nome' => trim($this->nome),
            ]);
        }

        if ($this->uf) {
            $this->merge([
                'uf' => strtoupper($this->uf),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'nome' => [
                'nullable',
                'string',
                'max:255',
            ],
            'uf' => [
                'nullable',
                'string',
                'size:2',
                Rule::in([
                    'AC','AL','AP','AM','BA','CE','DF','ES','GO',
                    'MA','MT','MS','MG','PA','PB','PR','PE','PI',
                    'RJ','RN','RS','RO','RR','SC','SP','SE','TO'
                ]),
            ],
            'codigo_ibge' => [
                'nullable',
                'string',
                'size:7',
            ],
            'codigo_siafi' => [
                'nullable',
                'string',
                'max:10',
            ],
            'por_pagina' => [
                'nullable',
                'integer',
                'min:1',
                'max:100',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'uf.size' => 'A UF deve conter exatamente 2 caracteres.',
            'uf.in' => 'A UF informada é inválida',

            'codigo_ibge.size' => 'O código IBGE deve conter 7 dígitos.',

            'por_pagina.integer' => 'A quantidade por página deve ser um número inteiro.',
            'por_pagina.min' => 'A quantidade por página deve ser no mínimo 1.',
            'por_pagina.max' => 'A quantidade por página deve ser no máximo 100.',
        ];
    }
}
