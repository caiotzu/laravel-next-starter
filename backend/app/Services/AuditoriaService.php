<?php

namespace App\Services;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

use App\Models\Auditoria;

use App\DTO\Auditoria\AuditoriaFiltroDTO;
use App\DTO\Auditoria\AuditoriaEntidadeFiltroDTO;
use App\Enums\AuditoriaEntidade;
class AuditoriaService
{
    public function listarEntidadesAuditaveis(): array
    {
        return array_map(fn (AuditoriaEntidade $entidade) => [
            'value' => $entidade->value,
            'label' => $entidade->label(),
        ], AuditoriaEntidade::cases());
    }

    public function listarRegistrosEntidade(
        AuditoriaEntidade $entidade,
        AuditoriaEntidadeFiltroDTO $filtro,
    ): LengthAwarePaginator {
        $model = $entidade->modelClass();

        $registros = $model::query()
            ->with($entidade->relacionamentosParaListagem())
            ->when($filtro->busca, function (Builder $query, string $busca) use ($entidade) {
                $query->where(function (Builder $query) use ($entidade, $busca) {
                    foreach ($entidade->camposPesquisa() as $campo) {
                        if ($campo === 'id') {
                            // O id costuma ser uuid; o operador ilike não
                            // existe para uuid sem cast explícito para text.
                            $query->orWhereRaw("id::text ilike ?", ["%{$busca}%"]);
                            continue;
                        }

                        $query->orWhere($campo, 'ilike', "%{$busca}%");
                    }
                });
            })
            ->orderBy($entidade->campoOrdenacao())
            ->withTrashed() // Para auditoria é bom trazer registros deletados também, para não perder histórico.
            ->paginate($filtro->paginacao->por_pagina);

        $registros->setCollection(
            $registros->getCollection()->map(
                fn ($registro) => $entidade->formatarRegistro($registro)
            )
        );

        return $registros;
    }

    /**
     * Única fonte de verdade da query de auditoria. Cobre tanto a busca
     * abrangente (admin) quanto a consulta de uma entidade específica —
     * basta informar entidade_tabela/entidade_id no filtro.
     *
     * Quando incluir_dependentes = true (junto com entidade_tabela/entidade_id),
     * o resultado também inclui registros de entidades "filhas" que apontam
     * para essa entidade como agrupador (ex.: EmpresaContato/EmpresaEndereco
     * de uma Empresa) — usado na tela "Histórico da Empresa".
     */
    public function listar(AuditoriaFiltroDTO $filtro): LengthAwarePaginator
    {
        $query = Auditoria::query();

        if ($filtro->entidade_tabela && $filtro->entidade_id && $filtro->incluir_dependentes) {
            $query->where(function (Builder $q) use ($filtro) {
                $q->where(function (Builder $q2) use ($filtro) {
                    $q2->where('entidade_tabela', $filtro->entidade_tabela)
                        ->where('entidade_id', $filtro->entidade_id);
                })->orWhere(function (Builder $q2) use ($filtro) {
                    $q2->where('agrupador_tabela', $filtro->entidade_tabela)
                        ->where('agrupador_id', $filtro->entidade_id);
                });
            });
        } else {
            $query
                ->when($filtro->entidade_tabela, fn (Builder $q) =>
                    $q->where('entidade_tabela', $filtro->entidade_tabela)
                )
                ->when($filtro->entidade_id, fn (Builder $q) =>
                    $q->where('entidade_id', $filtro->entidade_id)
                )
                ->when($filtro->agrupador_tabela, fn (Builder $q) =>
                    $q->where('agrupador_tabela', $filtro->agrupador_tabela)
                )
                ->when($filtro->agrupador_id, fn (Builder $q) =>
                    $q->where('agrupador_id', $filtro->agrupador_id)
                );
        }

        $auditorias = $query
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
            )
            ->with('usuario:id,nome,email')
            ->orderBy('criado_em', 'DESC')
            ->paginate($filtro->paginacao->por_pagina);

        $this->anexarDescricaoRegistro($auditorias);

        return $auditorias;
    }

    /**
     * Preenche o atributo virtual `registro` (descrição amigável do registro
     * auditado) em cada item da página, reutilizando a mesma configuração de
     * AuditoriaEntidade já usada nos filtros (camposPesquisa/formatarRegistro),
     * sem lógica if/switch por entidade.
     *
     * Faz no máximo uma query por entidade_tabela presente na página (não uma
     * por linha), e resolve silenciosamente para null quando a entidade não
     * está configurada em AuditoriaEntidade ou o registro não existe mais.
     */
    private function anexarDescricaoRegistro(LengthAwarePaginator $auditorias): void
    {
        /** @var \Illuminate\Pagination\LengthAwarePaginator $auditorias */
        $auditorias->getCollection()
            ->groupBy('entidade_tabela')
            ->each(function ($itens, string $tabela) {
                $entidade = AuditoriaEntidade::tryFrom($tabela);

                if (! $entidade) {
                    return;
                }

                $ids = $itens->pluck('entidade_id')->filter()->unique()->values();

                $labelsPorId = $entidade->modelClass()::query()
                    ->with($entidade->relacionamentosParaListagem())
                    ->withTrashed()
                    ->whereIn('id', $ids)
                    ->get()
                    ->mapWithKeys(fn ($registro) => [
                        (string) $registro->getKey() => $entidade->formatarRegistro($registro)['label'],
                    ]);


                $itens->each(function (Auditoria $auditoria) use ($labelsPorId) {
                    $auditoria->registro = $labelsPorId->get($auditoria->entidade_id);
                });
            });
    }
}
