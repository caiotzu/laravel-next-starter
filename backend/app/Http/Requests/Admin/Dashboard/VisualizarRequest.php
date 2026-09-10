<?php

namespace App\Http\Requests\Admin\Dashboard;

use Illuminate\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;

use App\Enums\DashboardPeriodo;

class VisualizarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'periodo' => ['nullable', Rule::enum(DashboardPeriodo::class)],
            'data_inicio' => [
                Rule::requiredIf($this->input('periodo') === DashboardPeriodo::PERSONALIZADO->value),
                'nullable',
                'date',
            ],
            'data_fim' => [
                Rule::requiredIf($this->input('periodo') === DashboardPeriodo::PERSONALIZADO->value),
                'nullable',
                'date',
                'after_or_equal:data_inicio',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'periodo.enum' => 'O período informado é inválido',

            'data_inicio.required' => 'A data de início é obrigatória para o período personalizado',
            'data_inicio.date'     => 'A data de início é inválida',

            'data_fim.required'       => 'A data de fim é obrigatória para o período personalizado',
            'data_fim.date'           => 'A data de fim é inválida',
            'data_fim.after_or_equal' => 'A data de fim deve ser posterior ou igual à data de início',
        ];
    }
}
