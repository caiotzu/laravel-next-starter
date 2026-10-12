<?php

namespace App\Repositories;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

use App\DTO\Grupo\GrupoFiltroDTO;
use App\Models\Grupo;
use App\Support\EscopoEntidade;

/**
 * Acesso a dados de Grupo.
 *
 * REGRA DE OURO (isolamento entre empresas): todo método que lê ou cria Grupo recebe um
 * EscopoEntidade e aplica o filtro (entidade_tipo_id + entidade_id) em UM só lugar —
 * noEscopo(). Não existe método de leitura sem escopo; se um dia precisar de um, ele deve
 * ter um nome que deixe isso explícito e entrar na lista de exceções do teste
 * tests/Unit/RepositoriesEscopoTest.php.
 *
 * O Repository só acessa dados. Regras de negócio, transações, eventos, auditoria manual e
 * BusinessException continuam no GrupoService.
 */
class GrupoRepository
{
    /**
     * Único ponto onde o escopo é aplicado a Grupo.
     */
    private function noEscopo(EscopoEntidade $escopo): Builder
    {
        return Grupo::query()
            ->where('entidade_tipo_id', $escopo->entidadeTipoId)
            ->where('entidade_id', $escopo->entidadeId);
    }

    public function buscarNoEscopo(EscopoEntidade $escopo, string $id): ?Grupo
    {
        return $this->noEscopo($escopo)->find($id);
    }

    /**
     * Grupo excluído (soft delete) do escopo, para reativação.
     */
    public function buscarExcluidoNoEscopo(EscopoEntidade $escopo, string $id): ?Grupo
    {
        return $this->noEscopo($escopo)->onlyTrashed()->find($id);
    }

    public function buscarComPermissoesNoEscopo(EscopoEntidade $escopo, string $id): ?Grupo
    {
        return $this->noEscopo($escopo)->with('permissoes')->find($id);
    }

    /**
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException
     */
    public function buscarComPermissoesNoEscopoOuFalhar(EscopoEntidade $escopo, string $id): Grupo
    {
        return $this->noEscopo($escopo)->with('permissoes')->findOrFail($id);
    }

    /**
     * Já existe um grupo com essa descrição no escopo? (considera só grupos não excluídos,
     * como a unicidade sempre foi verificada). `$ignorarId` serve à atualização.
     */
    public function existeComDescricaoNoEscopo(EscopoEntidade $escopo, string $descricao, ?string $ignorarId = null): bool
    {
        return $this->noEscopo($escopo)
            ->where('descricao', $descricao)
            ->when($ignorarId, fn (Builder $q) => $q->where('id', '!=', $ignorarId))
            ->exists();
    }

    public function listarNoEscopo(EscopoEntidade $escopo, GrupoFiltroDTO $filtro): LengthAwarePaginator
    {
        return $this->noEscopo($escopo)
            ->when($filtro->id, fn ($q) =>
                $q->where('id', $filtro->id)
            )
            ->when($filtro->descricao, fn ($q) =>
                $q->where('descricao', 'ilike', "%{$filtro->descricao}%")
            )
            ->when($filtro->excluido, fn ($q) =>
                $q->withTrashed()
            )
            ->orderBy('created_at', 'DESC')
            ->paginate($filtro->paginacao->por_pagina);
    }

    /**
     * Cria o grupo JÁ no escopo informado (não depende do hook `creating` do Model, que lê
     * o contexto implicitamente — ele continua existindo para os demais fluxos).
     */
    public function criarNoEscopo(EscopoEntidade $escopo, string $descricao): Grupo
    {
        return Grupo::create([
            'descricao' => $descricao,
            'entidade_tipo_id' => $escopo->entidadeTipoId,
            'entidade_id' => $escopo->entidadeId,
        ]);
    }
}
