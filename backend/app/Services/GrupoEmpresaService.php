<?php

namespace App\Services;

use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

use App\Models\GrupoEmpresa;

use App\DTO\GrupoEmpresa\GrupoEmpresaFiltroDTO;
use App\DTO\GrupoEmpresa\GrupoEmpresaCadastroDTO;
use App\DTO\GrupoEmpresa\GrupoEmpresaAtualizacaoDTO;

use App\Enums\ErrorCode;

use Exception;

class GrupoEmpresaService {

    public function cadastrar(GrupoEmpresaCadastroDTO $dto): GrupoEmpresa
    {
        return DB::transaction(function () use ($dto) {
            return GrupoEmpresa::create([
                'nome' => $dto->nome
            ]);
        });
    }

    public function atualizar(GrupoEmpresaAtualizacaoDTO $dto): GrupoEmpresa
    {
        return DB::transaction(function () use ($dto) {

            $grupoEmpresa = GrupoEmpresa::find($dto->id);
            if(!$grupoEmpresa)
                throw new Exception('Grupo empresa não encontrado.', ErrorCode::GRUPO_EMPRESA_NOT_FOUND->value);

            if (! $dto->temAlteracoes())
                throw new Exception('Nenhum dado informado para atualização.', ErrorCode::GRUPO_EMPRESA_REQUIRED->value);

            $grupoEmpresa->update($dto->paraPersistencia());

            return $grupoEmpresa;
        });
    }

    public function visualizar(string $id): GrupoEmpresa
    {
        return DB::transaction(function () use ($id) {
            $grupoEmpresa = GrupoEmpresa::find($id);

            if (! $grupoEmpresa) {
                throw new Exception(
                    'Grupo empresa não encontrado.',
                    ErrorCode::GRUPO_EMPRESA_NOT_FOUND->value
                );
            }

            return $grupoEmpresa;
        });
    }

    public function excluir(string $id): void
    {
        DB::transaction(function () use ($id) {

            $grupoEmpresa = GrupoEmpresa::find($id);

            if (! $grupoEmpresa) {
                throw new Exception(
                    'Grupo empresa não encontrado para exclusão.',
                    ErrorCode::GRUPO_EMPRESA_NOT_FOUND->value
                );
            }

            $grupoEmpresa->delete();
        });
    }

    public function ativar(string $id): GrupoEmpresa
    {
        return DB::transaction(function () use ($id) {

            $grupoEmpresa = GrupoEmpresa::onlyTrashed()->find($id);

            if (! $grupoEmpresa) {
                throw new Exception(
                    'Grupo empresa não encontrado para ativação.',
                    ErrorCode::GRUPO_EMPRESA_NOT_FOUND->value
                );
            }

            $grupoEmpresa->restore();

            return $grupoEmpresa;
        });
    }

    public function listar(GrupoEmpresaFiltroDTO $filtro): LengthAwarePaginator
    {
        return GrupoEmpresa::query()
            ->when($filtro->id, fn ($q) =>
                $q->where('id', $filtro->id)
            )
            ->when($filtro->nome, fn ($q) =>
                $q->where('nome', 'ilike', "%{$filtro->nome}%")
            )
            ->orderBy('nome')
            ->paginate($filtro->paginacao->porPagina);
    }
}
