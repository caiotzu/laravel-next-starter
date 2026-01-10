<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\ModelNotFoundException;

use App\Models\Usuario;

class UsuarioService {
    public function obterUsuarioAdminAtivoPorEmail(string $email): Usuario | null {
        return Usuario::with('grupo.entidadeTipo')
            ->whereHas('grupo.entidadeTipo', function (Builder $query) {
                return $query->where('chave', 'admin');
            })
            ->where('email', $email)
            ->where('ativo', true)
            ->first();
    }
}
