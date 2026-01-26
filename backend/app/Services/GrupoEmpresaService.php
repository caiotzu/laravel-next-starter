<?php

namespace App\Services;

use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

use App\Models\GrupoEmpresa;

use App\DTO\GrupoEmpresaDTO;

class GrupoEmpresaService {

    public function cadastrar(GrupoEmpresaDTO $dto): GrupoEmpresa
    {
        return DB::transaction(function () use ($dto) {
            return GrupoEmpresa::create([
                'nome' => $dto->nome
            ]);
        });
    }

    public function listar(GrupoEmpresaDTO $filtro): LengthAwarePaginator
    {
        return GrupoEmpresa::query()
            ->when($filtro->id, fn ($q) =>
                $q->where('id', $filtro->id)
            )
            ->when($filtro->nome, fn ($q) =>
                $q->where('nome', 'like', "%{$filtro->nome}%")
            )
            ->orderBy('nome')
            ->paginate($filtro->paginacao->porPagina);
    }
}
