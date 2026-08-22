<?php

namespace App\Http\Requests\Admin\Release;

use Illuminate\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;

use App\Enums\ReleaseTipo;
use App\Enums\EntidadeTipo;

class CadastrarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'contexto' => [
                'required',
                Rule::enum(EntidadeTipo::class),
            ],
            'titulo' => [
                'required',
                'string',
                'max:150',
            ],
            'conteudo' => [
                'required',
                'string',
            ],
            'tipo' => [
                'required',
                Rule::enum(ReleaseTipo::class),
            ],
            'versao' => [
                'required',
                'string',
                'max:30',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'contexto.required' => 'O contexto da release é obrigatório',
            'contexto.enum'     => 'O contexto informado é inválido',

            'titulo.required' => 'O título da release é obrigatório',
            'titulo.string'   => 'O título da release deve ser um texto',
            'titulo.max'      => 'O título da release deve ter no máximo 150 caracteres',

            'conteudo.required' => 'O conteúdo da release é obrigatório',
            'conteudo.string'   => 'O conteúdo da release deve ser um texto',

            'tipo.required' => 'O tipo da release é obrigatório',
            'tipo.enum'     => 'O tipo informado é inválido',

            'versao.required' => 'A versão da release é obrigatória',
            'versao.string'   => 'A versão da release deve ser um texto',
            'versao.max'      => 'A versão da release deve ter no máximo 30 caracteres',
        ];
    }
}
