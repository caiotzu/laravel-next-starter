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
            'ticket' => ['nullable', 'string', 'max:50'],
            'por_pagina' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'status.enum' => 'O status informado é inválido',
            'tipo.enum' => 'O tipo informado é inválido',

            'ticket.string' => 'O ticket informado deve ser um texto',
            'ticket.max' => 'O ticket informado deve ter no máximo 50 caracteres',

            'por_pagina.integer' => 'A quantidade por página deve ser um número inteiro',
            'por_pagina.min' => 'A quantidade por página deve ser no mínimo 1',
            'por_pagina.max' => 'A quantidade por página deve ser no máximo 100',
        ];
    }
}
