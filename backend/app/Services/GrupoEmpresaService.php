<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

use App\Models\Grupo;
use App\Models\Usuario;
use App\Models\Permissao;
use App\Models\EntidadeTipo;
use App\Models\GrupoEmpresa;

use App\DTO\GrupoEmpresa\GrupoEmpresaFiltroDTO;
use App\DTO\GrupoEmpresa\GrupoEmpresaCadastroDTO;
use App\DTO\GrupoEmpresa\GrupoEmpresaAtualizacaoDTO;

use App\Enums\ErrorCode;
use App\Exceptions\BusinessException;

class GrupoEmpresaService {

    public function cadastrar(GrupoEmpresaCadastroDTO $dto): GrupoEmpresa
    {
        return DB::transaction(function () use ($dto) {

            $entidadeTipo = EntidadeTipo::where('chave', 'private')->firstOrFail();
            $permissoesIds = Permissao::where('chave', 'like', 'private.%')->pluck('id');

            $grupoEmpresa = GrupoEmpresa::create([
                'nome' => $dto->nome
            ]);

            $grupo = Grupo::create([
                'descricao' => 'Administrador',
                'entidade_tipo_id' => $entidadeTipo->id,
                'entidade_id' => $grupoEmpresa->id
            ]);

            $grupo->permissoes()->sync($permissoesIds);

            Usuario::create([
                'grupo_id' => $grupo->id,
                'nome' => $dto->usuario->nome,
                'email' => $dto->usuario->email,
                'senha' => bcrypt('mudar123@'),
                'ativo' => true
            ]);

            return $grupoEmpresa;
        });
    }


    public function atualizar(GrupoEmpresaAtualizacaoDTO $dto): GrupoEmpresa
    {
        return DB::transaction(function () use ($dto) {

            $grupoEmpresa = GrupoEmpresa::find($dto->id);
            if(!$grupoEmpresa)
                throw new BusinessException('Grupo empresa não encontrado.', ErrorCode::GRUPO_EMPRESA_NOT_FOUND->value);

            if (! $dto->temAlteracoes())
                throw new BusinessException('Nenhum dado informado para atualização.', ErrorCode::GRUPO_EMPRESA_REQUIRED->value);

            $grupoEmpresa->update($dto->paraPersistencia());

            return $grupoEmpresa;
        });
    }

    public function visualizar(string $id): GrupoEmpresa
    {
        return DB::transaction(function () use ($id) {
            $grupoEmpresa = GrupoEmpresa::with(['grupos.usuarios'])->find($id);

            if (! $grupoEmpresa) {
                throw new BusinessException(
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
                throw new BusinessException(
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
                throw new BusinessException(
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
             ->when($filtro->excluido, fn ($q) =>
                $q->withTrashed()
            )
            ->orderBy('created_at', 'DESC')
            ->paginate($filtro->paginacao->por_pagina);
    }
}
