<?php

namespace App\Listeners;

use App\Events\UsuarioExcluido;
use App\Events\UsuarioStatusAlterado;

use App\Enums\UsuarioStatus;

class InvalidarSessoesDoUsuario
{
    public function __construct(
    ) {}

    public function handle(UsuarioStatusAlterado | UsuarioExcluido $event): void
    {
        $usuario = $event->usuario;

        if($usuario->status !== UsuarioStatus::ATIVO || $usuario->deleted_at) {
            $usuario->usuarioSessoes()
                ->where('ativo', true)
                ->update([
                    'ativo' => false,
                    'logout_em' => now(),
                ]);
        }
    }
}
