<?php

namespace App\Http\Requests\Admin\Chamado;

use Illuminate\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;

use App\Enums\ChamadoStatus;

class AtualizarStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::enum(ChamadoStatus::class)],
        ];
    }

    public function messages(): array
    {
        return [
            'status.required' => 'O status é obrigatório',
            'status.enum'     => 'O status informado é inválido',
        ];
    }
}
