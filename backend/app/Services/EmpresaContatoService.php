<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

use App\Events\EmpresaDadosObrigatoriosAtualizados;

use App\Models\Empresa;
use App\Models\EmpresaContato;

use App\DTO\EmpresaContato\EmpresaContatoFiltroDTO;
use App\DTO\EmpresaContato\EmpresaContatoCadastroDTO;
use App\DTO\EmpresaContato\EmpresaContatoAtualizacaoDTO;

use App\Enums\ErrorCode;
use App\Enums\EntidadeTipo;

use App\Exceptions\BusinessException;

class EmpresaContatoService {

    private function aplicarEscopoEntidade(Builder $query, EntidadeTipo $entidadeTipo): Builder
    {
        if ($entidadeTipo === EntidadeTipo::ADMIN) {
            return $query;
        }

        return $query->where(
            'grupo_empresa_id',
            Auth::user()->grupo->entidade_id
        );
    }

    private function validarAcessoEmpresa(string $empresaId, EntidadeTipo $entidadeTipo): Empresa
    {
        $query = Empresa::query();

        $this->aplicarEscopoEntidade($query, $entidadeTipo);

        $empresa = $query->find($empresaId);

        if (!$empresa) {
            throw new BusinessException(
                'Empresa não encontrada.',
                ErrorCode::EMPRESA_NOT_FOUND->value
            );
        }

        return $empresa;
    }

    public function cadastrar(EmpresaContatoCadastroDTO $dto, EntidadeTipo $entidadeTipo): EmpresaContato
    {
        return DB::transaction(function () use ($dto, $entidadeTipo) {

            $empresa = $this->validarAcessoEmpresa($dto->empresa_id, $entidadeTipo);

            $contato = EmpresaContato::create([
                'empresa_id' => $dto->empresa_id,
                'tipo' => $dto->tipo,
                'valor' => $dto->valor,
                'ativo' => $dto->ativo,
                'principal' => $dto->principal
            ]);

            /**
             * Dispara o evento para verificar se a empresa pode ser ativada
             */
            event(new EmpresaDadosObrigatoriosAtualizados($empresa));

            return $contato;
        });
    }

    public function atualizar(EmpresaContatoAtualizacaoDTO $dto, EntidadeTipo $entidadeTipo): EmpresaContato
    {
        return DB::transaction(function () use ($dto, $entidadeTipo) {

            $empresa = $this->validarAcessoEmpresa($dto->empresa_id, $entidadeTipo);

            $contato = EmpresaContato::where('id', $dto->contato_id)
                ->where('empresa_id', $dto->empresa_id)
                ->first();

            if(!$contato) {
                throw new BusinessException(
                    'Contato não encontrada.',
                    ErrorCode::EMPRESA_CONTATO_NOT_FOUND->value
                );
            }

            $contato->update($dto->paraPersistencia());

            /**
             * Dispara o evento para verificar se a empresa pode ser ativada
             */
            event(new EmpresaDadosObrigatoriosAtualizados($empresa));

            return $contato;
        });
    }

    public function visualizar(string $empresaId, string $contatoId, EntidadeTipo $entidadeTipo): EmpresaContato
    {
        return DB::transaction(function () use ($empresaId, $contatoId, $entidadeTipo) {

            $this->validarAcessoEmpresa($empresaId, $entidadeTipo);

            $contato = EmpresaContato::where('empresa_id', $empresaId)
                ->find($contatoId);

            if (! $contato) {
                throw new BusinessException(
                    'Contato não encontrado.',
                    ErrorCode::EMPRESA_CONTATO_NOT_FOUND->value
                );
            }

            return $contato;
        });
    }

    public function excluir(string $empresaId, string $contatoId, EntidadeTipo $entidadeTipo): void
    {
        DB::transaction(function () use ($empresaId, $contatoId, $entidadeTipo) {

            $empresa = $this->validarAcessoEmpresa($empresaId, $entidadeTipo);

            $contato = EmpresaContato::where('empresa_id', $empresaId)->find($contatoId);

            if (!$contato) {
                throw new BusinessException(
                    'Contato não encontrado para exclusão.',
                    ErrorCode::EMPRESA_CONTATO_NOT_FOUND->value
                );
            }

            $contato->delete();
            $contato->fresh();

            /**
             * Dispara o evento para verificar se a empresa pode ser ativada
             */
            event(new EmpresaDadosObrigatoriosAtualizados($empresa));
        });
    }

    public function ativar(string $empresaId, string $contatoId, EntidadeTipo $entidadeTipo): EmpresaContato
    {
        return DB::transaction(function () use ($empresaId, $contatoId, $entidadeTipo) {

            $empresa = $this->validarAcessoEmpresa($empresaId, $entidadeTipo);

            $contato = EmpresaContato::onlyTrashed()->where('empresa_id', $empresaId)->find($contatoId);

            if (!$contato) {
                throw new BusinessException(
                    'Contato não encontrado para ativação.',
                    ErrorCode::EMPRESA_CONTATO_NOT_FOUND->value
                );
            }

            $contato->restore();
            $contato->fresh();

            /**
             * Dispara o evento para verificar se a empresa pode ser ativada
             */
            event(new EmpresaDadosObrigatoriosAtualizados($empresa));

            return $contato;
        });
    }

    public function listar(EmpresaContatoFiltroDTO $filtro, EntidadeTipo $entidadeTipo): Collection
    {
        $this->validarAcessoEmpresa($filtro->empresa_id, $entidadeTipo);

        return EmpresaContato::query()
            ->when($filtro->empresa_id, fn ($q) =>
                $q->where('empresa_id', $filtro->empresa_id)
            )
            ->orderBy('created_at', 'DESC')
            ->get();
    }
}
