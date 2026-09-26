<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

use App\Events\EmpresaDadosObrigatoriosAtualizados;

use App\Models\Empresa;

use App\DTO\Empresa\EmpresaCadastroDTO;
use App\DTO\Empresa\EmpresaAtualizacaoDTO;
use App\DTO\Empresa\EmpresaFiltroDTO;

use App\Enums\ErrorCode;
use App\Enums\EntidadeTipo;

use App\Exceptions\BusinessException;

class EmpresaService {

    public function __construct(
        protected EscopoEntidadeService $escopoEntidade,
    ) {}

    /**
     * Empresa hoje só é criada pela rota Admin (irrestrita), então esta
     * validação nunca rejeita nada no comportamento atual — mas passa a
     * proteger automaticamente o dia em que uma rota Private de cadastro
     * existir, sem exigir nenhuma alteração aqui (ver item 18 da análise:
     * impedir que um grupo_empresa_id de outro contexto seja enviado no
     * payload).
     */
    public function cadastrar(EmpresaCadastroDTO $dto): Empresa
    {
        return DB::transaction(function () use ($dto) {

            $this->escopoEntidade->validarPertence(
                $dto->grupo_empresa_id,
                'Grupo empresa informado é inválido.',
                ErrorCode::EMPRESA_REQUIRED->value
            );

            $empresa = Empresa::create([
                'grupo_empresa_id' => $dto->grupo_empresa_id,
                'matriz_id' => $dto->matriz_id,
                'cnpj' => $dto->cnpj,
                'nome_fantasia' => $dto->nome_fantasia,
                'razao_social' => $dto->razao_social,
                'inscricao_estadual' => $dto->inscricao_estadual,
                'inscricao_municipal' => $dto->inscricao_municipal,
                'uf' => $dto->uf
            ]);

            /**
             * Dispara o evento para verificar se a empresa pode ser ativada
             */
            event(new EmpresaDadosObrigatoriosAtualizados($empresa));

            return $empresa;
        });
    }

    /**
     * $entidadeTipo aqui NÃO decide mais o escopo de dados (isso é feito
     * internamente por EscopoEntidadeService, com base no contexto
     * autenticado/AcessoSuporteContexto). Ele é usado somente para
     * selecionar quais campos do payload são persistidos — ver
     * EmpresaAtualizacaoDTO::paraPersistencia() — uma regra de negócio
     * independente (quais campos cada área pode editar), já reforçada de
     * forma redundante pelas FormRequests de Admin/Private, e que não faz
     * parte da centralização de escopo pedida.
     */
    public function atualizar(EmpresaAtualizacaoDTO $dto, EntidadeTipo $entidadeTipo): Empresa
    {
        return DB::transaction(function () use ($dto, $entidadeTipo) {
            $query = $this->escopoEntidade->aplicar(Empresa::query());

            $empresa = $query->find($dto->empresa_id);
            if (!$empresa)
                throw new BusinessException('Empresa não encontrada.', ErrorCode::EMPRESA_NOT_FOUND->value);

            if ($dto->matriz_id) {
                $matrizQuery = $this->escopoEntidade->aplicar(Empresa::query());

                $matrizValida = $matrizQuery
                    ->where('id', $dto->matriz_id)
                    ->where('id', '!=', $empresa->id)
                    ->exists();

                if (! $matrizValida) {
                    throw new BusinessException('Matriz informada é inválida.', ErrorCode::EMPRESA_MATRIZ_INVALIDA->value);
                }
            }

            $empresa->update($dto->paraPersistencia($entidadeTipo));

            /**
             * Dispara o evento para verificar se a empresa pode ser ativada
             */
            event(new EmpresaDadosObrigatoriosAtualizados($empresa));

            return $empresa;
        });
    }

    public function visualizar(string $id): Empresa
    {
        return DB::transaction(function () use ($id) {
            $query = Empresa::with([
                'grupoEmpresa',
                'contatos',
                'enderecos.municipio'
            ])->withTrashed();

            $query = $this->escopoEntidade->aplicar($query);

            $empresa = $query->find($id);

            if (! $empresa) {
                throw new BusinessException(
                    'Empresa não encontrado.',
                    ErrorCode::EMPRESA_NOT_FOUND->value
                );
            }

            return $empresa;
        });
    }

    public function excluir(string $id): void
    {
        DB::transaction(function () use ($id) {

            $empresa = Empresa::find($id);

            if (!$empresa) {
                throw new BusinessException(
                    'Empresa não encontrado para exclusão.',
                    ErrorCode::EMPRESA_NOT_FOUND->value
                );
            }

            $empresa->delete();
            $empresa->fresh();

            /**
             * Dispara o evento para verificar se a empresa pode ser ativada
             */
            event(new EmpresaDadosObrigatoriosAtualizados($empresa));
        });
    }

    public function ativar(string $id): Empresa
    {
        return DB::transaction(function () use ($id) {

            $empresa = Empresa::onlyTrashed()->find($id);


            if (!$empresa) {
                throw new BusinessException(
                    'Empresa não encontrado para ativação.',
                    ErrorCode::EMPRESA_NOT_FOUND->value
                );
            }

            $empresa->restore();
            $empresa->fresh();

            /**
             * Dispara o evento para verificar se a empresa pode ser ativada
             */
            event(new EmpresaDadosObrigatoriosAtualizados($empresa));

            return $empresa;
        });
    }

    public function listar(EmpresaFiltroDTO $filtro): LengthAwarePaginator
    {
        $query = Empresa::query()
            ->with([
                'grupoEmpresa',
                'matriz'
            ]);

        $query = $this->escopoEntidade->aplicar($query);

        return $query->when($filtro->id, fn ($q) =>
                $q->where('id', $filtro->id)
            )
            ->when($filtro->grupo_empresa_id, fn ($q) =>
                $q->where('grupo_empresa_id', $filtro->grupo_empresa_id)
            )
            ->when($filtro->matriz_id, fn ($q) =>
                $q->where('matriz_id', $filtro->matriz_id)
            )
            ->when($filtro->cnpj, fn ($q) =>
                $q->where('cnpj', 'ilike', "%{$filtro->cnpj}%")
            )
            ->when($filtro->nome_fantasia, fn ($q) =>
                $q->where('nome_fantasia', 'ilike', "%{$filtro->nome_fantasia}%")
            )
            ->when($filtro->razao_social, fn ($q) =>
                $q->where('razao_social', 'ilike', "%{$filtro->razao_social}%")
            )
            ->when($filtro->inscricao_estadual, fn ($q) =>
                $q->where('inscricao_estadual', 'ilike', "%{$filtro->inscricao_estadual}%")
            )
            ->when($filtro->inscricao_municipal, fn ($q) =>
                $q->where('inscricao_municipal', 'ilike', "%{$filtro->inscricao_municipal}%")
            )
            ->when($filtro->uf, fn ($q) =>
                $q->where('uf', $filtro->uf)
            )
            ->when($filtro->excluido, fn ($q) =>
                $q->withTrashed()
            )
            ->orderBy('created_at', 'DESC')
            ->paginate($filtro->paginacao->por_pagina);
    }
}
