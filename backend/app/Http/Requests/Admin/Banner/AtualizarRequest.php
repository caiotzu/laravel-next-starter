<?php

namespace App\Http\Requests\Admin\Banner;

use Illuminate\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;

use App\Enums\BannerDirecionamentoTipo;
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
            // Cada item é uma imagem existente (id) OU uma nova (nome + conteudo).
            'imagens.*.id' => [
                'nullable',
                'uuid',
                Rule::exists('banner_imagens', 'id'),
            ],
            'imagens.*.nome' => [
                // O nome é só um rótulo informativo (usado em mensagens de
                // erro) — nunca a origem de verdade da imagem, então não
                // pode ser obrigatório: uma imagem já existente (enviada só
                // com `id`) legitimamente não tem `nome` no payload. Quando
                // ausente, o Service gera um rótulo padrão automaticamente
                // (ver BannerService::armazenarImagem).
                'nullable',
                'string',
                'max:255',
            ],
            'imagens.*.conteudo' => [
                'nullable',
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

    /**
     * Regra que não dá para expressar direto em `rules()`: quando o item
     * de imagem é novo (sem `id`), `conteudo` passa a ser obrigatório.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            foreach ($this->input('imagens', []) as $index => $imagem) {
                if (empty($imagem['id']) && empty($imagem['conteudo'])) {
                    $validator->errors()->add(
                        "imagens.{$index}.conteudo",
                        'O conteúdo é obrigatório para uma imagem nova.'
                    );
                }
            }
        });
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

            'imagens.required' => 'É obrigatório manter ao menos uma imagem',
            'imagens.array'    => 'As imagens informadas são inválidas',
            'imagens.min'      => 'É obrigatório manter ao menos uma imagem',
            'imagens.max'      => 'O banner permite no máximo 10 imagens',

            'imagens.*.id.uuid'   => 'Uma das imagens informadas é inválida',
            'imagens.*.id.exists' => 'Uma das imagens informadas não foi encontrada',

            'links.array' => 'Os links informados são inválidos',
            'links.max'   => 'O banner permite no máximo 10 links',

            'links.*.nome.required' => 'O nome do link é obrigatório',
            'links.*.nome.max'      => 'O nome do link deve ter no máximo 60 caracteres',

            'links.*.url.required' => 'A URL do link é obrigatória',
            'links.*.url.url'      => 'A URL do link informada é inválida',
        ];
    }
}
