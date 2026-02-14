<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\UsuarioSessao;

class LimparSessoesExpiradasCommand extends Command
{
    protected $signature = 'usuario-sessao:limpar-expiradas';
    protected $description = 'Remove sessões expiradas por inatividade';

    public function handle(): void
    {
        UsuarioSessao::where('ativo', true)
            ->where('ultimo_acesso_em', '<', now()->subMinute(30))
            ->update([
                'ativo' => false,
                'logout_em' => now(),
            ]);

        $this->info('Sessões expiradas limpas com sucesso.');
    }
}
