<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

use App\Auditoria\Auditavel;

use App\Enums\AcessoSuporteStatus;
use App\Enums\AcessoSuporteEncerradoPor;

/**
 * Concessão de acesso temporário de suporte: um usuário de uma entidade
 * concedente (Private, e futuramente Despachante, Revenda, Montadora...)
 * autoriza um usuário Admin a atuar, por tempo limitado, dentro do escopo
 * daquela entidade.
 *
 * A entidade concedente é representada com o MESMO mecanismo já usado em
 * `grupos.entidade_tipo_id`/`entidade_id` (ver Grupo::entidade()): não há
 * nada nesta classe, no Service, no Middleware ou no Contexto que saiba o
 * que é "Private" — isso vive inteiramente no dado (`entidade_tipos`), não
 * no código. Novas entidades concedentes não exigem alterar nada aqui.
 *
 * Esta tabela NUNCA representa uma troca de identidade — Auth::user()
 * continua sendo sempre o Admin real. Ela apenas concede, de forma
 * explícita, temporária e revogável, o direito de o Admin consultar dados
 * escopados a esta entidade (ver App\AcessoSuporte\AcessoSuporteContexto).
 */
class AcessoSuporte extends Model
{
    use HasUuids;
    use Auditavel;

    protected $table = 'acessos_suporte';

    protected $fillable = [
        'id',
        'entidade_tipo_id',
        'entidade_id',
        'usuario_concedente_id',
        'usuario_admin_id',
        'motivo',
        'status',
        'iniciado_em',
        'expira_em',
        'encerrado_em',
        'encerrado_por',
        'encerrado_motivo',
        'metadados',
    ];

    protected $casts = [
        'status' => AcessoSuporteStatus::class,
        'encerrado_por' => AcessoSuporteEncerradoPor::class,
        'metadados' => 'array',
        'iniciado_em' => 'datetime',
        'expira_em' => 'datetime',
        'encerrado_em' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function entidadeTipo(): BelongsTo
    {
        return $this->belongsTo(EntidadeTipo::class, 'entidade_tipo_id', 'id');
    }

    public function concedente(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_concedente_id', 'id');
    }

    public function admin(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_admin_id', 'id');
    }

    /**
     * Resolve a entidade concreta (ex: GrupoEmpresa) a partir de
     * entidade_tipo_id/entidade_id — mesmo mecanismo de Grupo::entidade().
     * Adicionar uma nova entidade concedente é adicionar uma linha neste
     * match, nunca alterar a estrutura da classe.
     *
     * OBS: só pode ser chamada depois de carregado (precisa de
     * entidadeTipo já resolvido); não pode ser usada no with() do Eloquent.
     */
    public function entidade(): ?Model
    {
        $classe = match ($this->entidadeTipo->entidade_tabela) {
            'grupo_empresas' => GrupoEmpresa::class,
            default => null,
        };

        if (!$classe) {
            return null;
        }

        return $classe::find($this->entidade_id);
    }

    /**
     * Agrupa a auditoria deste acesso junto ao histórico da entidade
     * concedente afetada (mesmo padrão usado por EmpresaContato/EmpresaEndereco).
     */
    public function auditavelAgrupador(): ?Model
    {
        return $this->entidade();
    }

    /**
     * Único ponto de verdade sobre "este acesso pode ser usado agora?".
     * Reutilizado pelo Service (na validação por request) e pelo comando
     * agendado de limpeza (mesmo padrão do UsuarioSessaoService).
     */
    public function estaValido(): bool
    {
        return $this->status === AcessoSuporteStatus::ATIVO
            && $this->expira_em !== null
            && $this->expira_em->isFuture();
    }
}
