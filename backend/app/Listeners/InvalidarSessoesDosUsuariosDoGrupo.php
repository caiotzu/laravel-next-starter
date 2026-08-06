<?php

namespace App\Listeners;

use App\Events\GrupoExcluido;

use App\Models\Usuario;
use App\Models\UsuarioSessao;

class InvalidarSessoesDosUsuariosDoGrupo
{
    public function __construct(
    ) {}

    public function handle(GrupoExcluido $event): void
    {
        $grupo = $event->grupo;

        if($grupo->deleted_at) {
            $usuarioIds = Usuario::query()
                ->where(
                    'grupo_id',
                   $grupo->id
                )
                ->pluck('id');

            UsuarioSessao::query()
                ->whereIn('usuario_id', $usuarioIds)
                ->where('ativo', true)
                ->update([
                    'ativo' => false,
                    'logout_em' => now(),
                ]);
        }
    }
}
