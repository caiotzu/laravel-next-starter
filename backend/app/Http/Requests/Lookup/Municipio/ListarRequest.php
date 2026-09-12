<?php

namespace App\Http\Requests\Lookup\Municipio;

use Illuminate\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;

use App\Enums\UF;

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
                Rule::in(
                    array_column(UF::cases(), 'value')
                ),
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
            'nome.string' => 'O nome do município deve ser um texto.',
            'nome.max' => 'O nome do município pode ter no máximo 255 caracteres.',

            'uf.string' => 'A UF deve ser um texto.',
            'uf.size' => 'A UF deve conter exatamente 2 caracteres.',
            'uf.in' => 'A UF informada é inválida',

            'codigo_ibge.string' => 'O código IBGE deve ser um texto.',
            'codigo_ibge.size' => 'O código IBGE deve conter 7 dígitos.',

            'codigo_siafi.string' => 'O código SIAFI deve ser um texto.',
            'codigo_siafi.max' => 'O código SIAFI pode ter no máximo 10 caracteres.',

            'por_pagina.integer' => 'A quantidade por página deve ser um número inteiro.',
            'por_pagina.min' => 'A quantidade por página deve ser no mínimo 1.',
            'por_pagina.max' => 'A quantidade por página deve ser no máximo 100.',
        ];
    }
}
