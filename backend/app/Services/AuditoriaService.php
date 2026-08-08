<?php

namespace App\Services;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

use App\Models\Auditoria;

use App\DTO\Auditoria\AuditoriaFiltroDTO;

class AuditoriaService
{
    /**
     * Histórico individual de UM registro específico.
     * Ex.: só as alterações feitas diretamente na Empresa X (sem contatos/endereços).
     */
    public function listarPorEntidade(string $entidadeTabela, string $entidadeId, AuditoriaFiltroDTO $filtro): LengthAwarePaginator
    {
        $query = Auditoria::query()
            ->where('entidade_tabela', $entidadeTabela)
            ->where('entidade_id', $entidadeId);

        return $this->aplicarFiltros($query, $filtro)
            ->with('usuario:id,nome,email')
            ->orderBy('criado_em', 'DESC')
            ->paginate($filtro->paginacao->por_pagina);
    }

    /**
     * Histórico agrupado (ex.: Empresa X + tudo que pertence a ela, como
     * EmpresaContato e EmpresaEndereco). Usado na tela "Histórico da Empresa".
     */
    public function listarPorAgrupador(string $agrupadorTabela, string $agrupadorId, AuditoriaFiltroDTO $filtro): LengthAwarePaginator
    {
        $query = Auditoria::query()->where(function (Builder $query) use ($agrupadorTabela, $agrupadorId) {
            // A própria entidade (ex.: alteração direta na Empresa)...
            $query->where(function (Builder $q) use ($agrupadorTabela, $agrupadorId) {
                $q->where('entidade_tabela', $agrupadorTabela)
                    ->where('entidade_id', $agrupadorId);
            })
            // ...ou qualquer registro filho que aponte para ela como agrupador
            // (ex.: EmpresaContato e EmpresaEndereco desta Empresa).
            ->orWhere(function (Builder $q) use ($agrupadorTabela, $agrupadorId) {
                $q->where('agrupador_tabela', $agrupadorTabela)
                    ->where('agrupador_id', $agrupadorId);
            });
        });

        return $this->aplicarFiltros($query, $filtro)
            ->with('usuario:id,nome,email')
            ->orderBy('criado_em', 'DESC')
            ->paginate($filtro->paginacao->por_pagina);
    }

    /**
     * Tudo que um usuário específico fez, independente da entidade.
     */
    public function listarPorUsuario(string $usuarioId, AuditoriaFiltroDTO $filtro): LengthAwarePaginator
    {
        $query = Auditoria::query()->where('usuario_id', $usuarioId);

        return $this->aplicarFiltros($query, $filtro)
            ->orderBy('criado_em', 'DESC')
            ->paginate($filtro->paginacao->por_pagina);
    }

    private function aplicarFiltros(Builder $query, AuditoriaFiltroDTO $filtro): Builder
    {
        return $query
            ->when($filtro->acao, fn (Builder $q) =>
                $q->where('acao', $filtro->acao->value)
            )
            ->when($filtro->usuario_id, fn (Builder $q) =>
                $q->where('usuario_id', $filtro->usuario_id)
            )
            ->when($filtro->data_inicio, fn (Builder $q) =>
                $q->whereDate('criado_em', '>=', $filtro->data_inicio)
            )
            ->when($filtro->data_fim, fn (Builder $q) =>
                $q->whereDate('criado_em', '<=', $filtro->data_fim)
            );
    }
}
