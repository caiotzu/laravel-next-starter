<?php

namespace App\Http\Requests\Admin\Auditoria;

use Illuminate\Foundation\Http\FormRequest;

class ListarEntidadeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->busca) {
            $this->merge(['busca' => trim($this->busca)]);
        }
    }

    public function rules(): array
    {
        return [
            'busca' => ['nullable', 'string', 'max:255'],
            'por_pagina' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'busca.string' => 'O termo de busca deve ser um texto',
            'busca.max' => 'O termo de busca deve ter no máximo 255 caracteres',

            'por_pagina.integer' => 'A quantidade por página deve ser um número inteiro',
            'por_pagina.min' => 'A quantidade por página deve ser no mínimo 1',
            'por_pagina.max' => 'A quantidade por página deve ser no máximo 100',
        ];
    }
}
