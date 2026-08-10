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
}
