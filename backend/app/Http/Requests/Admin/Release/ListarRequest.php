<?php

namespace App\Http\Requests\Admin\Release;

use Illuminate\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;

use App\Enums\ReleaseTipo;
use App\Enums\ReleaseStatus;
use App\Enums\EntidadeTipo;

class ListarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'contexto' => [
                'nullable',
                Rule::enum(EntidadeTipo::class),
            ],
            'status' => [
                'nullable',
                Rule::enum(ReleaseStatus::class),
            ],
            'tipo' => [
                'nullable',
                Rule::enum(ReleaseTipo::class),
            ],
            'por_pagina' => [
                'nullable',
                'integer',
                'min:1',
                'max:100',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'contexto.enum' => 'O contexto informado é inválido',
            'status.enum'   => 'O status informado é inválido',
            'tipo.enum'     => 'O tipo informado é inválido',

            'por_pagina.integer' => 'A quantidade por página deve ser um número inteiro',
            'por_pagina.min'     => 'A quantidade por página deve ser no mínimo 1',
            'por_pagina.max'     => 'A quantidade por página deve ser no máximo 100',
        ];
    }
}
