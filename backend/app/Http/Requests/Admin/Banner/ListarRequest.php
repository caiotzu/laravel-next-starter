<?php

namespace App\Http\Requests\Admin\Banner;

use Illuminate\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;

use App\Enums\BannerStatus;

class ListarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Query string sempre chega como texto ("true"/"false") — mesma
     * conversão usada em Admin\GrupoEmpresa\ListarRequest para o mesmo
     * filtro.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('excluido')) {
            $this->merge([
                'excluido' => filter_var(
                    $this->excluido,
                    FILTER_VALIDATE_BOOLEAN,
                    FILTER_NULL_ON_FAILURE
                ),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'titulo' => [
                'nullable',
                'string',
                'max:120',
            ],
            'status' => [
                'nullable',
                Rule::enum(BannerStatus::class),
            ],
            'por_pagina' => [
                'nullable',
                'integer',
                'min:1',
                'max:100',
            ],
            'excluido' => [
                'nullable',
                'boolean',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'titulo.string' => 'O título informado deve ser um texto',
            'titulo.max'    => 'O título informado deve ter no máximo 120 caracteres',

            'status.enum' => 'O status informado é inválido',

            'por_pagina.integer' => 'A quantidade por página deve ser um número inteiro',
            'por_pagina.min'     => 'A quantidade por página deve ser no mínimo 1',
            'por_pagina.max'     => 'A quantidade por página deve ser no máximo 100',

            'excluido.boolean' => 'O filtro excluído deve ser do tipo boolean',
        ];
    }
}
