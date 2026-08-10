<?php

namespace App\Http\Requests\Admin\Auditoria;

use Illuminate\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;

use App\Enums\AuditoriaAcao;

class ListarRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

     protected function prepareForValidation(): void
    {
        if ($this->has('incluir_dependentes')) {
            $this->merge([
                'incluir_dependentes' => filter_var(
                    $this->incluir_dependentes,
                    FILTER_VALIDATE_BOOLEAN,
                    FILTER_NULL_ON_FAILURE
                ),
            ]);
        }
    }

    public function rules(): array
    {
        return [
            'entidade_tabela' => [
                'nullable',
                'string',
                'max:60',
                'required_if:incluir_dependentes,true',
            ],
            'entidade_id' => [
                'nullable',
                'uuid',
            ],
            'agrupador_tabela' => [
                'nullable',
                'string',
                'max:60',
            ],
            'agrupador_id' => [
                'nullable',
                'uuid',
                'required_with:agrupador_tabela',
            ],
            'incluir_dependentes' => [
                'nullable',
                'boolean',
                'prohibits:agrupador_tabela,agrupador_id',
            ],
            'acao' => [
                'nullable',
                'string',
                Rule::in(
                    array_column(AuditoriaAcao::cases(), 'value')
                ),
            ],
            'usuario_id' => [
                'nullable',
                'uuid',
                Rule::exists('usuarios', 'id')
            ],
            'data_inicio' => [
                'nullable',
                'date_format:Y-m-d',
            ],
            'data_fim' => [
                'nullable',
                'date_format:Y-m-d',
                'after_or_equal:data_inicio',
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
            'entidade_tabela.string' => 'A entidade informada deve ser um texto',
            'entidade_tabela.max'    => 'A entidade informada deve ter no máximo 60 caracteres',
            'entidade_tabela.required_if' => 'Informe a entidade_tabela para usar incluir_dependentes',

            'entidade_id.uuid'           => 'O identificador da entidade informado não é um UUID válido',
            'agrupador_tabela.string' => 'O agrupador informado deve ser um texto',
            'agrupador_tabela.max'    => 'O agrupador informado deve ter no máximo 60 caracteres',

            'agrupador_id.uuid'          => 'O identificador do agrupador informado não é um UUID válido',
            'agrupador_id.required_with' => 'Informe o identificador do agrupador quando filtrar por agrupador_tabela',

            'incluir_dependentes.boolean'  => 'O filtro incluir_dependentes deve ser do tipo boolean',
            'incluir_dependentes.prohibits' => 'incluir_dependentes não pode ser usado junto com agrupador_tabela/agrupador_id',

            'acao.in' => 'A ação informada é inválida',

            'usuario_id.uuid'   => 'O identificador do usuário informado não é um UUID válido',
            'usuario_id.exists' => 'O identificador do usuário informado não foi encontrado',

            'data_inicio.date_format' => 'A data início deve estar no formato AAAA-MM-DD',

            'data_fim.date_format'    => 'A data fim deve estar no formato AAAA-MM-DD',
            'data_fim.after_or_equal' => 'A data fim deve ser igual ou posterior à data início',

            'por_pagina.integer' => 'A quantidade por página deve ser um número inteiro',
            'por_pagina.min'     => 'A quantidade por página deve ser no mínimo 1',
            'por_pagina.max'     => 'A quantidade por página deve ser no máximo 100',
        ];
    }
}
