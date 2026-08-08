<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;

use App\Models\Auditoria;

class GravarAuditoriaJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    /**
     * @param array $payload Já contém usuário/origem/ip/user-agent resolvidos
     *                       no momento do evento (não podem ser resolvidos
     *                       aqui dentro, pois o job pode rodar em um worker
     *                       sem request/autenticação disponíveis).
     */
    public function __construct(
        public readonly array $payload
    ) {}

    public function handle(): void
    {
        Auditoria::create($this->payload);
    }
}
