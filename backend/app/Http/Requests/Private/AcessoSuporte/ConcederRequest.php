<?php

namespace App\Http\Requests\Private\AcessoSuporte;

use Illuminate\Support\Facades\Auth;
use Illuminate\Foundation\Http\FormRequest;

use App\Models\Empresa;
use App\Models\Usuario;

use App\Enums\EntidadeTipo;
use App\Services\AcessoSuporteService;

class ConcederRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'usuario_admin_id' => [
                'required',
                'uuid',
                'exists:usuarios,id',
            ],
            'empresa_id' => [
                'nullable',
                'uuid',
                'exists:empresas,id',
            ],
            'motivo' => [
                'nullable',
                'string',
                'max:500',
            ],
            'duracao_minutos' => [
                'required',
                'integer',
                'min:' . AcessoSuporteService::DURACAO_MINIMA_MINUTOS,
                'max:' . AcessoSuporteService::DURACAO_MAXIMA_MINUTOS,
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'usuario_admin_id.required' => 'É necessário selecionar o administrador que receberá o acesso.',
            'usuario_admin_id.exists' => 'O administrador selecionado não foi encontrado.',

            'empresa_id.exists' => 'A empresa selecionada não foi encontrada.',

            'motivo.max' => 'O motivo pode ter no máximo 500 caracteres.',

            'duracao_minutos.required' => 'É necessário informar por quanto tempo o acesso ficará disponível.',
            'duracao_minutos.min' => 'O acesso deve durar pelo menos ' . AcessoSuporteService::DURACAO_MINIMA_MINUTOS . ' minutos.',
            'duracao_minutos.max' => 'O acesso não pode durar mais que ' . AcessoSuporteService::DURACAO_MAXIMA_MINUTOS . ' minutos.',
        ];
    }

    public function withValidator($validator)
    {
        $validator->after(function ($validator) {

            $adminId = $this->input('usuario_admin_id');

            if (!$adminId) {
                return;
            }

            $admin = Usuario::with('grupo.entidadeTipo')->find($adminId);

            if (!$admin || $admin->grupo?->entidadeTipo?->chave !== EntidadeTipo::ADMIN) {
                $validator->errors()->add(
                    'usuario_admin_id',
                    'O usuário selecionado não é um administrador.'
                );
            }

            $empresaId = $this->input('empresa_id');

            if ($empresaId) {
                $empresa = Empresa::find($empresaId);
                $grupoEmpresaId = Auth::user()->grupo->entidade_id;

                if (!$empresa || $empresa->grupo_empresa_id !== $grupoEmpresaId) {
                    $validator->errors()->add(
                        'empresa_id',
                        'A empresa selecionada não pertence à sua organização.'
                    );
                }
            }
        });
    }
}
