<?php

namespace App\Http\Requests\Admin\Chamado;

use Illuminate\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;

use App\Enums\EntidadeTipo;

class AtribuirResponsavelRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // O responsável precisa ser um usuário ADMIN ativo (não excluído). Antes aceitava
            // qualquer usuário, inclusive de clientes — que passariam a receber notificações
            // com número e assunto de chamados de outros clientes.
            'responsavel_id' => [
                'nullable',
                'uuid',
                Rule::exists('usuarios', 'id')->where(function ($query) {
                    $query->whereNull('deleted_at')
                        ->whereIn('grupo_id', function ($sub) {
                            $sub->select('grupos.id')
                                ->from('grupos')
                                ->join('entidade_tipos', 'entidade_tipos.id', '=', 'grupos.entidade_tipo_id')
                                ->whereNull('grupos.deleted_at')
                                ->where('entidade_tipos.chave', EntidadeTipo::ADMIN->value);
                        });
                }),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'responsavel_id.uuid'   => 'O responsável informado é inválido',
            'responsavel_id.exists' => 'O responsável informado não foi encontrado',
        ];
    }
}
