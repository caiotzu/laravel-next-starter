<?php

namespace App\Listeners;

use App\Events\GrupoEmpresaExcluido;

use App\Models\Usuario;
use App\Models\UsuarioSessao;

class InvalidarSessoesDosUsuariosDoGrupoEmpresa
{
    public function __construct(
    ) {}

    public function handle(GrupoEmpresaExcluido $event): void
    {
        $grupoEmpresa = $event->grupoEmpresa;

        if($grupoEmpresa->deleted_at) {
            $usuarioIds = Usuario::query()
                ->whereIn(
                    'grupo_id',
                   $grupoEmpresa->grupos()->select('id')
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
