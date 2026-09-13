<?php

namespace App\Http\Requests\Admin\Banner;

use Illuminate\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;

use App\Enums\BannerDirecionamentoTipo;
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
            'titulo' => [
                'required',
                'string',
                'max:120',
            ],
            'conteudo' => [
                'nullable',
                'string',
            ],
            'inicio_em' => [
                'required',
                'date',
            ],
            'fim_em' => [
                'nullable',
                'date',
                'after:inicio_em',
            ],

            'direcionamento.tipo' => [
                'required',
                Rule::enum(BannerDirecionamentoTipo::class),
            ],
            'direcionamento.entidade_tipo' => [
                Rule::requiredIf(fn () => $this->input('direcionamento.tipo') === BannerDirecionamentoTipo::ENTIDADE->value),
                'nullable',
                Rule::enum(EntidadeTipo::class),
            ],

            'imagens' => [
                'required',
                'array',
                'min:1',
                'max:10',
            ],
            'imagens.*.nome' => [
                'nullable',
                'string',
                'max:255',
            ],
            'imagens.*.conteudo' => [
                'required',
                'string',
            ],

            'links' => [
                'nullable',
                'array',
                'max:10',
            ],
            'links.*.nome' => [
                'required',
                'string',
                'max:60',
            ],
            'links.*.url' => [
                'required',
                'string',
                'max:2048',
                'url',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'titulo.required' => 'O título do banner é obrigatório',
            'titulo.string'   => 'O título do banner deve ser um texto',
            'titulo.max'      => 'O título do banner deve ter no máximo 120 caracteres',

            'conteudo.string' => 'O conteúdo do banner deve ser um texto',

            'inicio_em.required' => 'A data de início da campanha é obrigatória',
            'inicio_em.date'     => 'A data de início da campanha é inválida',

            'fim_em.date'  => 'A data de término da campanha é inválida',
            'fim_em.after' => 'A data de término deve ser posterior à data de início',

            'direcionamento.tipo.required' => 'O direcionamento do banner é obrigatório',
            'direcionamento.tipo.enum'     => 'O direcionamento informado é inválido',

            'direcionamento.entidade_tipo.required' => 'Selecione a entidade de destino',
            'direcionamento.entidade_tipo.enum'     => 'A entidade informada é inválida',

            'imagens.required' => 'É obrigatório enviar ao menos uma imagem',
            'imagens.array'    => 'As imagens informadas são inválidas',
            'imagens.min'      => 'É obrigatório enviar ao menos uma imagem',
            'imagens.max'      => 'O banner permite no máximo 10 imagens',

            'imagens.*.conteudo.required' => 'O conteúdo de cada imagem é obrigatório',

            'links.array' => 'Os links informados são inválidos',
            'links.max'   => 'O banner permite no máximo 10 links',

            'links.*.nome.required' => 'O nome do link é obrigatório',
            'links.*.nome.max'      => 'O nome do link deve ter no máximo 60 caracteres',

            'links.*.url.required' => 'A URL do link é obrigatória',
            'links.*.url.url'      => 'A URL do link informada é inválida',
        ];
    }
}
