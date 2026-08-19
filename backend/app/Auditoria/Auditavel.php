<?php

namespace App\Auditoria;

use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

use App\Jobs\GravarAuditoriaJob;
use App\Enums\AuditoriaAcao;

/**
 * Adiciona auditoria automática (cadastro/atualização/exclusão/restauração)
 * a um Model, sem exigir nenhuma alteração nos Services existentes.
 *
 * Uso básico:
 *
 *   class Empresa extends Model
 *   {
 *       use Auditavel;
 *   }
 *
 * Customizações disponíveis no Model que usa a trait (todas opcionais):
 *
 *   protected array $auditavelOculto = ['algum_campo_tecnico'];
 *   protected array $auditavelSensivel = ['senha'];
 *
 *   protected function auditavelAgrupador(): ?Model
 *   {
 *       // Para registros "filhos" (ex: EmpresaContato), retorna a entidade
 *       // "pai" (ex: Empresa) para permitir consultar o histórico agrupado.
 *       return $this->empresa;
 *   }
 */
trait Auditavel
{
    protected static function bootAuditavel(): void
    {
        static::created(function (Model $model) {
            static::auditar($model, AuditoriaAcao::CADASTRO, [], $model->getAttributes());
        });

        static::updated(function (Model $model) {
            $depois = static::auditavelFiltrarCampos($model, $model->getChanges());

            if (empty($depois)) {
                // Nada relevante mudou (ex.: apenas updated_at, ou um campo
                // técnico ignorado via $auditavelOculto).
                return;
            }

            $antes = [];
            foreach (array_keys($depois) as $campo) {
                $antes[$campo] = $model->getOriginal($campo);
            }

            static::auditar($model, AuditoriaAcao::ATUALIZACAO, $antes, $depois);
        });

        // Usamos "deleting" (e não "deleted") para capturar os dados ANTES
        // do soft delete marcar deleted_at, garantindo um snapshot fiel do
        // registro no momento da exclusão.
        static::deleting(function (Model $model) {
            static::auditar($model, AuditoriaAcao::EXCLUSAO, $model->getAttributes(), []);
        });

        // "restored" só existe em models que usam SoftDeletes.
        if (method_exists(static::class, 'restored')) {
            static::restored(function (Model $model) {
                static::auditar($model, AuditoriaAcao::RESTAURACAO, [], $model->getAttributes());
            });
        }
    }

    /**
     * Permite registrar manualmente uma auditoria para ações que NÃO passam
     * pelos eventos padrão do Eloquent — o caso típico é uma relação
     * BelongsToMany::sync() (ex.: Grupo::permissoes()->sync(...)), que altera
     * a tabela pivô diretamente sem disparar 'updating'/'updated' no Model.
     *
     * Exemplo de uso no Service, após um sync():
     *
     *   $grupo->registrarAuditoriaManual(
     *       AuditoriaAcao::ATUALIZACAO,
     *       ['permissoes' => $permissoesAntes],
     *       ['permissoes' => $permissoesDepois],
     *   );
     */
    public function registrarAuditoriaManual(AuditoriaAcao $acao, array $antes, array $depois): void
    {
        static::auditar($this, $acao, $antes, $depois);
    }

    private static function auditar(Model $model, AuditoriaAcao $acao, array $antes, array $depois): void
    {
        $antes = static::auditavelFiltrarCampos($model, $antes);
        $depois = static::auditavelFiltrarCampos($model, $depois);

        [$agrupadorTabela, $agrupadorId] = static::auditavelResolverAgrupador($model);

        $contexto = app(AuditoriaContexto::class);

        $payload = [
            'entidade_tabela' => $model->getTable(),
            'entidade_id' => (string) $model->getKey(),
            'agrupador_tabela' => $agrupadorTabela,
            'agrupador_id' => $agrupadorId,
            'acao' => $acao->value,
            'usuario_id' => $contexto->usuarioId(),
            'acesso_suporte_id' => $contexto->acessoSuporteId(),
            'origem' => $contexto->origem()->value,
            'ip' => $contexto->ip(),
            'user_agent' => $contexto->userAgent(),
            'dados_antes' => empty($antes) ? null : $antes,
            'dados_depois' => empty($depois) ? null : $depois,
            'campos_alterados' => $acao === AuditoriaAcao::ATUALIZACAO ? array_keys($depois) : null,
            'criado_em' => now(),
        ];

        // DB::afterCommit executa a closure imediatamente se não houver
        // transação ativa, ou apenas após o commit se estiver dentro de um
        // DB::transaction() (evitando registrar auditoria de algo que sofreu
        // rollback).
        DB::afterCommit(fn () => GravarAuditoriaJob::dispatch($payload));
    }

    private static function auditavelFiltrarCampos(Model $model, array $dados): array
    {
        $ocultos = array_merge(
            ['created_at', 'updated_at', 'deleted_at'],
            $model->auditavelOculto ?? []
        );

        $dados = array_diff_key($dados, array_flip($ocultos));

        foreach (($model->auditavelSensivel ?? []) as $campo) {
            if (array_key_exists($campo, $dados)) {
                $dados[$campo] = '***';
            }
        }

        return $dados;
    }

    private static function auditavelResolverAgrupador(Model $model): array
    {
        if (method_exists($model, 'auditavelAgrupador')) {
            $agrupador = $model->auditavelAgrupador();

            if ($agrupador) {
                return [$agrupador->getTable(), (string) $agrupador->getKey()];
            }
        }

        return [null, null];
    }
}
