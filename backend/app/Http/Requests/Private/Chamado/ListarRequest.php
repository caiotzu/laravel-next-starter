<?php

namespace App\Http\Requests\Private\Chamado;

use Illuminate\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;

use App\Enums\ChamadoStatus;
use App\Enums\ChamadoTipo;

class ListarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['nullable', Rule::enum(ChamadoStatus::class)],
            'tipo' => ['nullable', Rule::enum(ChamadoTipo::class)],
            'por_pagina' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }
}
