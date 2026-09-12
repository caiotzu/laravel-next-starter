<?php

namespace App\Http\Requests\Admin\Chamado;

use Illuminate\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;

use App\Enums\ChamadoStatus;
use App\Enums\ChamadoTipo;
use App\Enums\ChamadoPrioridade;

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
            'prioridade' => ['nullable', Rule::enum(ChamadoPrioridade::class)],
            'responsavel_id' => ['nullable', 'uuid', 'exists:usuarios,id'],
            'ticket' => ['nullable', 'string', 'max:50'],
            'por_pagina' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'status.enum' => 'O status informado é inválido',
            'tipo.enum' => 'O tipo informado é inválido',
            'prioridade.enum' => 'A prioridade informada é inválida',

            'responsavel_id.uuid' => 'O identificador do responsável informado não é um UUID válido',
            'responsavel_id.exists' => 'O responsável informado não foi encontrado',

            'ticket.string' => 'O ticket informado deve ser um texto',
            'ticket.max' => 'O ticket informado deve ter no máximo 50 caracteres',

            'por_pagina.integer' => 'A quantidade por página deve ser um número inteiro',
            'por_pagina.min' => 'A quantidade por página deve ser no mínimo 1',
            'por_pagina.max' => 'A quantidade por página deve ser no máximo 100',
        ];
    }
}
