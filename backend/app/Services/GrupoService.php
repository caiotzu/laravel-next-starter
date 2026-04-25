<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

use App\Models\Grupo;

use App\DTO\Grupo\GrupoFiltroDTO;
use App\DTO\Grupo\GrupoCadastroDTO;
use App\DTO\Grupo\GrupoAtualizacaoDTO;

use App\Enums\ErrorCode;

use App\Exceptions\BusinessException;

class GrupoService {

    public function cadastrar(GrupoCadastroDTO $dto): Grupo
    {
        return DB::transaction(function () use ($dto) {
            $grupo = Grupo::create(['descricao' => $dto->descricao]);

            return $grupo;
        });
    }

    public function atualizar(GrupoAtualizacaoDTO $dto): Grupo
    {
        return DB::transaction(function () use ($dto) {

            $grupo = Grupo::find($dto->id);
            if(!$grupo)
                throw new BusinessException('Grupo não encontrado.', ErrorCode::GRUPO_NOT_FOUND->value);

            if (! $dto->temAlteracoes())
                throw new BusinessException('Nenhum dado informado para atualização.', ErrorCode::GRUPO_REQUIRED->value);

            $grupo->update($dto->paraPersistencia());

            return $grupo;
        });
    }

    public function visualizar(string $id): Grupo
    {
        return DB::transaction(function () use ($id) {
            $grupo = Grupo::with('permissoes')->find($id);

            if (! $grupo) {
                throw new BusinessException(
                    'Grupo não encontrado.',
                    ErrorCode::GRUPO_NOT_FOUND->value
                );
            }

            return $grupo;
        });
    }

    public function excluir(string $id): void
    {
        DB::transaction(function () use ($id) {

            $grupo = Grupo::find($id);

            if (!$grupo) {
                throw new BusinessException(
                    'Grupo não encontrado para exclusão.',
                    ErrorCode::GRUPO_NOT_FOUND->value
                );
            }

            $grupo->delete();
            $grupo->fresh();
        });
    }

    public function ativar(string $id): Grupo
    {
        return DB::transaction(function () use ($id) {

            $grupo = Grupo::onlyTrashed()->find($id);

            if (!$grupo) {
                throw new BusinessException(
                    'Grupo não encontrado para ativação.',
                    ErrorCode::GRUPO_NOT_FOUND->value
                );
            }

            $grupo->restore();

            return $grupo->fresh();
        });
    }

    public function listar(GrupoFiltroDTO $filtro): LengthAwarePaginator
    {
        return Grupo::query()
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
}
