<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

use App\Services\AcessoSuporteService;

/**
 * Mesmo padrão do LimparSessoesExpiradasCommand (UsuarioSessao): mantém o
 * status gravado em `acessos_suporte` coerente com a expiração real, sem
 * depender de uma nova requisição (X-Acesso-Suporte-Id) para "descobrir"
 * que um acesso venceu — o que hoje só acontecia dentro de
 * AcessoSuporteService::validarAtiva().
 *
 * Ver AcessoSuporteService::expirarVencidos() para a regra em si; este
 * comando é só o agendamento (routes/console.php).
 */
class ExpirarAcessosSuporteVencidosCommand extends Command
{
    protected $signature = 'acesso-suporte:expirar-vencidos';
    protected $description = 'Expira acessos de suporte ativos cuja data/hora de expiração já passou';

    public function __construct(
        protected AcessoSuporteService $acessoSuporteService,
    ) {
        parent::__construct();
    }

    public function handle(): void
    {
        $total = $this->acessoSuporteService->expirarVencidos();

        $this->info("Acessos de suporte expirados: {$total}.");
    }
}
