<?php

namespace App\Http\Requests\Admin\Chamado;

use Illuminate\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;

use App\Enums\ChamadoPrioridade;

class AtualizarPrioridadeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'prioridade' => ['required', Rule::enum(ChamadoPrioridade::class)],
        ];
    }

    public function messages(): array
    {
        return [
            'prioridade.required' => 'A prioridade é obrigatória',
            'prioridade.enum'     => 'A prioridade informada é inválida',
        ];
    }
}
