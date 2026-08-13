<?php

namespace App\Http\Requests\Admin\Mensagem;

use Illuminate\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;

use App\Enums\MensagemDirecionamentoTipo;
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
                'required',
                'string',
            ],
            'direcionamento.tipo' => [
                'required',
                Rule::enum(MensagemDirecionamentoTipo::class),
            ],
            'direcionamento.entidade_tipo' => [
                Rule::requiredIf(fn () => $this->input('direcionamento.tipo') === MensagemDirecionamentoTipo::ENTIDADE->value),
                'nullable',
                Rule::enum(EntidadeTipo::class),
            ],
            'direcionamento.grupo_empresa_id' => [
                Rule::requiredIf(fn () => $this->input('direcionamento.tipo') === MensagemDirecionamentoTipo::GRUPO_EMPRESA->value),
                'nullable',
                'uuid',
                Rule::exists('grupo_empresas', 'id')->whereNull('deleted_at'),
            ],
            'direcionamento.usuario_id' => [
                Rule::requiredIf(fn () => $this->input('direcionamento.tipo') === MensagemDirecionamentoTipo::USUARIO->value),
                'nullable',
                'uuid',
                Rule::exists('usuarios', 'id')->whereNull('deleted_at'),
            ],
        ];
    }

    public function messages(): array {
        return [
            'titulo.required' => 'O título da mensagem é obrigatório',
            'titulo.string'   => 'O título da mensagem deve ser um texto',
            'titulo.max'      => 'O título da mensagem deve ter no máximo 120 caracteres',

            'conteudo.required' => 'O conteúdo da mensagem é obrigatório',
            'conteudo.string'   => 'O conteúdo da mensagem deve ser um texto',

            'direcionamento.tipo.required' => 'O direcionamento da mensagem é obrigatório',
            'direcionamento.tipo.enum'     => 'O direcionamento informado é inválido',

            'direcionamento.entidade_tipo.required' => 'Selecione a entidade de destino',
            'direcionamento.entidade_tipo.enum'     => 'A entidade informada é inválida',

            'direcionamento.grupo_empresa_id.required' => 'Selecione o grupo de empresa de destino',
            'direcionamento.grupo_empresa_id.uuid'      => 'O grupo de empresa informado não é um UUID válido',
            'direcionamento.grupo_empresa_id.exists'    => 'O grupo de empresa informado não foi encontrado',

            'direcionamento.usuario_id.required' => 'Selecione o usuário de destino',
            'direcionamento.usuario_id.uuid'      => 'O usuário informado não é um UUID válido',
            'direcionamento.usuario_id.exists'    => 'O usuário informado não foi encontrado',
        ];
    }
}
