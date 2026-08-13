<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;

use App\Models\Usuario;
use App\Models\Grupo;
use App\Models\GrupoEmpresa;

use App\Enums\MensagemDirecionamentoTipo;

/**
 * Resolve os usuários destinatários de uma mensagem e materializa uma linha
 * por usuário em `mensagem_destinatarios`, em lotes (chunks), para suportar
 * o envio para grupos de empresa (ou para todos os usuários do sistema) com
 * um volume grande de usuários sem comprometer a memória/performance da
 * aplicação.
 */
class PopularDestinatariosMensagemJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    private const TAMANHO_LOTE = 500;

    public function __construct(
        public readonly string $mensagemId,
        public readonly MensagemDirecionamentoTipo $tipo,
        public readonly ?string $entidadeTipoId = null,
        public readonly ?string $grupoEmpresaId = null,
        public readonly ?string $usuarioId = null,
    ) {}

    public function handle(): void
    {
        match ($this->tipo) {
            MensagemDirecionamentoTipo::USUARIO => $this->inserirDestinatarios([$this->usuarioId]),
            MensagemDirecionamentoTipo::GERAL => $this->processarGeral(),
            MensagemDirecionamentoTipo::ENTIDADE => $this->processarEntidade(),
            MensagemDirecionamentoTipo::GRUPO_EMPRESA => $this->processarGrupoEmpresa(),
        };
    }

    /**
     * GERAL: todos os usuários do sistema, independente da entidade a que
     * pertencem.
     */
    private function processarGeral(): void
    {
        Usuario::query()
            ->select('id')
            ->orderBy('id')
            ->chunkById(self::TAMANHO_LOTE, function ($usuarios) {
                $this->inserirDestinatarios($usuarios->pluck('id')->all());
            });
    }

    /**
     * ENTIDADE: todos os usuários cujo grupo pertence à entidade
     * selecionada (ex: ADMIN, PRIVATE), via `grupos.entidade_tipo_id`.
     */
    private function processarEntidade(): void
    {
        if (! $this->entidadeTipoId) {
            return;
        }

        Usuario::query()
            ->whereIn('grupo_id', Grupo::where('entidade_tipo_id', $this->entidadeTipoId)->select('id'))
            ->select('id')
            ->orderBy('id')
            ->chunkById(self::TAMANHO_LOTE, function ($usuarios) {
                $this->inserirDestinatarios($usuarios->pluck('id')->all());
            });
    }

    /**
     * GRUPO_EMPRESA: todos os usuários pertencentes às empresas de um
     * grupo de empresa (mesma lógica já utilizada em
     * InvalidarSessoesDosUsuariosDoGrupoEmpresa).
     */
    private function processarGrupoEmpresa(): void
    {
        $grupoEmpresa = GrupoEmpresa::find($this->grupoEmpresaId);

        if (! $grupoEmpresa) {
            return;
        }

        Usuario::query()
            ->whereIn('grupo_id', $grupoEmpresa->grupos()->select('id'))
            ->select('id')
            ->orderBy('id')
            ->chunkById(self::TAMANHO_LOTE, function ($usuarios) {
                $this->inserirDestinatarios($usuarios->pluck('id')->all());
            });
    }

    private function inserirDestinatarios(array $usuarioIds): void
    {
        $usuarioIds = array_filter($usuarioIds);

        if (empty($usuarioIds)) {
            return;
        }

        $agora = now();

        $linhas = array_map(fn (string $usuarioId) => [
            'id' => (string) Str::uuid(),
            'mensagem_id' => $this->mensagemId,
            'usuario_id' => $usuarioId,
            'lida_em' => null,
            'created_at' => $agora,
            'updated_at' => $agora,
        ], $usuarioIds);

        // insertOrIgnore evita duplicidade (respeitando o unique de
        // mensagem_id + usuario_id) e permite reprocessamento seguro em
        // caso de retry do job.
        DB::table('mensagem_destinatarios')->insertOrIgnore($linhas);
    }
}
