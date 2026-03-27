<?php

namespace App\Services;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

use App\Models\Municipio;

use App\DTO\Lookup\Municipio\MunicipioFiltroDTO;

use App\Enums\ErrorCode;

use App\Exceptions\BusinessException;

class MunicipioService {

    public function listar(MunicipioFiltroDTO $filtro): LengthAwarePaginator
    {
        return Municipio::query()
            ->when($filtro->nome, fn ($q) =>
                $q->where('nome', 'ilike', "%{$filtro->nome}%")
            )
            ->when($filtro->uf, fn ($q) =>
                $q->where('uf', $filtro->uf)
            )
            ->when($filtro->codigo_ibge, fn ($q) =>
                $q->where('codigo_ibge', $filtro->codigo_ibge)
            )
            ->when($filtro->codigo_siafi, fn ($q) =>
                $q->where('codigo_siafi', $filtro->codigo_siafi)
            )
            ->orderBy('nome', 'ASC')
            ->paginate($filtro->paginacao->por_pagina);
    }
}
