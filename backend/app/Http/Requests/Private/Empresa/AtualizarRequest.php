<?php

namespace App\Http\Requests\Private\Empresa;

use Illuminate\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;

use App\Enums\UF;

class AtualizarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'matriz_id' => [
                'nullable',
                'uuid',
                Rule::exists('empresas', 'id')
            ],
            'nome_fantasia' => [
                'required',
                'string',
                'max:60',
            ],
            'razao_social' => [
                'required',
                'string',
                'max:60',
            ],
            'inscricao_estadual' => [
                'nullable',
                'string',
                'max:255',
            ],
            'inscricao_municipal' => [
                'nullable',
                'string',
                'max:255',
            ],
            'uf' => [
                'required',
                'string',
                Rule::in(
                    array_column(UF::cases(), 'value')
                ),
            ]
        ];
    }

    public function messages(): array
    {
        return [
            'matriz_id.required' => 'A matriz é obrigatória.',
            'matriz_id.uuid' => 'O ID da matriz deve ser um UUID válido.',
            'matriz_id.exists' => 'A empresa informada como matriz não existe.',

            'nome_fantasia.required' => 'O nome fantasia é obrigatório.',
            'nome_fantasia.string' => 'O nome fantasia deve ser um texto.',
            'nome_fantasia.max' => 'O nome fantasia deve ter no máximo 60 caracteres.',

            'razao_social.required' => 'A razão social é obrigatória.',
            'razao_social.string' => 'A razão social deve ser um texto.',
            'razao_social.max' => 'A razão social deve ter no máximo 60 caracteres.',

            'inscricao_estadual.string' => 'A inscrição estadual deve ser um texto.',
            'inscricao_estadual.max' => 'A inscrição estadual deve ter no máximo 255 caracteres.',

            'inscricao_municipal.string' => 'A inscrição municipal deve ser um texto.',
            'inscricao_municipal.max' => 'A inscrição municipal deve ter no máximo 255 caracteres.',

            'uf.required' => 'A UF é obrigatória.',
            'uf.string' => 'A UF deve ser um texto.',
            'uf.in' => 'A UF informada é inválida.'
        ];
    }
}
