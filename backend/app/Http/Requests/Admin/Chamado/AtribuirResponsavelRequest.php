<?php

namespace App\Http\Requests\Admin\Chamado;

use Illuminate\Foundation\Http\FormRequest;

class AtribuirResponsavelRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'responsavel_id' => ['nullable', 'uuid', 'exists:usuarios,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'responsavel_id.uuid'   => 'O responsável informado é inválido',
            'responsavel_id.exists' => 'O responsável informado não foi encontrado',
        ];
    }
}
