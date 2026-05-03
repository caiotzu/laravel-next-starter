<?php

namespace App\Listeners;

use App\Events\EmpresaDadosObrigatoriosAtualizados;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

use App\Enums\EmpresaStatus;
use App\Enums\EmpresaContatoTipo;

class ValidarAtivacaoAutomaticaEmpresa
{
    public function __construct()
    {}

    public function handle(EmpresaDadosObrigatoriosAtualizados $event): void
    {
        $empresa = $event->empresa;
        if(!$empresa)
            return;

        /**
         * Faz a atualização para ativo ou pendente dependendo do caso,
         * porem se estiver inativo ou bloqueado não alterar os status
         */
        if (in_array($empresa->status, [EmpresaStatus::INATIVO, EmpresaStatus::BLOQUEADO])) {
            return;
        }

        $temContatoEmail = $empresa->contatos()
            ->where('tipo', EmpresaContatoTipo::EMAIL)
            ->where('ativo', true)
            ->where('principal', true)
            ->exists();

        $temContatoTelefone = $empresa->contatos()
            ->where('tipo', EmpresaContatoTipo::TELEFONE)
            ->where('ativo', true)
            ->where('principal', true)
            ->exists();

        $temEndereco = $empresa->enderecos()
            ->where('ativo', true)
            ->where('principal', true)
            ->exists();

        $novoStatus = ($temContatoEmail && $temContatoTelefone && $temEndereco)
            ? EmpresaStatus::ATIVO
            : EmpresaStatus::PENDENTE;

        if ($empresa->status !== $novoStatus) {
            $empresa->update(['status' => $novoStatus]);
        }
    }
}
