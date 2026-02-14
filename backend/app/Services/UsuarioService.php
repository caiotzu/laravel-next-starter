<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\ModelNotFoundException;

use App\Models\Usuario;

use App\Enums\EntidadeTipo;

class UsuarioService {
    public function registrarLogin(Usuario $usuario, ?string $ip): void
    {
        $usuario->update([
            'ultimo_login_em' => now(),
            'ultimo_ip' => $ip,
        ]);
    }

    public function encerrarSessao(Usuario $user, string $id): void
    {
        $sessao = $user->usuarioSessoes()->where('id', $id)->firstOrFail();

        $sessao->update([
            'ativo' => false,
            'logout_em' => now(),
        ]);
    }

    public function listarSessoesAtivas(Usuario $usuario)
    {
        return $usuario->usuarioSessoes()->where('ativo', true)->get();
    }

    public function obterUsuarioAtivoPorEmail(string $email, EntidadeTipo $entidadeTipo): Usuario | null {
        return Usuario::with('grupo.entidadeTipo')
            ->whereHas('grupo.entidadeTipo', function (Builder $query) use ($entidadeTipo) {
                return $query->where('chave', $entidadeTipo->value);
            })
            ->where('email', $email)
            ->where('ativo', true)
            ->first();
    }
}
