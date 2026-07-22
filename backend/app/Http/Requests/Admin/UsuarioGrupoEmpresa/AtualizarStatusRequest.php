<?php

namespace App\Http\Requests\Admin\UsuarioGrupoEmpresa;

use App\Enums\UsuarioStatus;
use Illuminate\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;

class AtualizarStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => [
                'required',
                Rule::in([
                    UsuarioStatus::ATIVO->value,
                    UsuarioStatus::INATIVO->value,
                    UsuarioStatus::BLOQUEADO->value,
                ]),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'status.required' => 'O status/situação é obrigatório',
            'status.in' => 'O status/situação deve ser ('.UsuarioStatus::ATIVO->value.','.UsuarioStatus::INATIVO->value.','.UsuarioStatus::BLOQUEADO->value.')',
        ];
    }
}
