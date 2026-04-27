<?php

namespace App\Services;

use Illuminate\Database\Eloquent\Collection;

use App\Models\Permissao;

use App\Enums\PermissaoTipo;

class PermissaoService {

    public function listar(PermissaoTipo $tipo): Collection
    {
        return Permissao::where("chave", "like", $tipo->value."%")->get();
    }
}
