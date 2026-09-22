<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

use App\Models\ChamadoAnexo;

/**
 * Move os anexos de chamado já existentes do disco 'public' (acessível por URL direta em
 * /storage/...) para o disco privado 'local'. Necessário uma única vez ao aplicar a correção
 * que passou a entregar anexos por link assinado; anexos novos já nascem no disco privado.
 *
 * Idempotente e seguro: copia, confere e só então apaga o original. Use --dry-run para ver o
 * que seria movido.
 */
class MoverAnexosChamadosParaDiscoPrivadoCommand extends Command
{
    protected $signature = 'chamados:mover-anexos-privados {--dry-run : Apenas lista o que seria movido}';

    protected $description = 'Move os anexos de chamado do disco público para o disco privado.';

    public function handle(): int
    {
        $publico = Storage::disk('public');
        $privado = Storage::disk('local');

        $movidos = 0;
        $ausentes = 0;

        ChamadoAnexo::query()->select(['id', 'caminho'])->chunkById(200, function ($anexos) use ($publico, $privado, &$movidos, &$ausentes) {
            foreach ($anexos as $anexo) {
                $caminho = $anexo->caminhoArmazenado();

                if (! $caminho || ! $publico->exists($caminho)) {
                    // Já está no privado (ou o arquivo não existe mais).
                    if (! $caminho || ! $privado->exists($caminho)) {
                        $ausentes++;
                    }
                    continue;
                }

                $this->line(($this->option('dry-run') ? '[dry-run] ' : '') . "movendo {$caminho}");

                if ($this->option('dry-run')) {
                    $movidos++;
                    continue;
                }

                $privado->put($caminho, $publico->get($caminho));

                if ($privado->exists($caminho) && $privado->size($caminho) === $publico->size($caminho)) {
                    $publico->delete($caminho);
                    $movidos++;
                } else {
                    $this->error("Falha ao copiar {$caminho}; original mantido.");
                }
            }
        });

        $this->info("Concluído. Movidos: {$movidos}. Arquivos não encontrados em nenhum disco: {$ausentes}.");

        return self::SUCCESS;
    }
}
