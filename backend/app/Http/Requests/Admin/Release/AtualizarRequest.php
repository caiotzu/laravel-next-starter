<?php

namespace App\Http\Requests\Admin\Release;

use Illuminate\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;

use App\Enums\ReleaseTipo;
use App\Enums\EntidadeTipo;

class AtualizarRequest extends FormRequest
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
            'titulo' => [
                'nullable',
                'string',
                'max:150',
            ],
            'conteudo' => [
                'nullable',
                'string',
            ],
            'tipo' => [
                'nullable',
                Rule::enum(ReleaseTipo::class),
            ],
            'versao' => [
                'nullable',
                'string',
                'max:30',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'contexto.enum' => 'O contexto informado é inválido',

            'titulo.string' => 'O título da release deve ser um texto',
            'titulo.max'    => 'O título da release deve ter no máximo 150 caracteres',

            'conteudo.string' => 'O conteúdo da release deve ser um texto',

            'tipo.enum' => 'O tipo informado é inválido',

            'versao.string' => 'A versão da release deve ser um texto',
            'versao.max'    => 'A versão da release deve ter no máximo 30 caracteres',
        ];
    }
}
