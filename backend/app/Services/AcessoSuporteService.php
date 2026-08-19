<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\Collection;

use App\Models\Usuario;
use App\Models\AcessoSuporte;
use App\Models\EntidadeTipo;

use App\DTO\AcessoSuporte\AcessoSuporteConcessaoDTO;
use App\DTO\Mensagem\MensagemCadastroDTO;

use App\Enums\ErrorCode;
use App\Enums\EntidadeTipo as EntidadeTipoEnum;
use App\Enums\AcessoSuporteStatus;
use App\Enums\AcessoSuporteEncerradoPor;
use App\Enums\MensagemOrigem;
use App\Enums\MensagemDirecionamentoTipo;

use App\Exceptions\BusinessException;

/**
 * Genérico para qualquer entidade concedente (Private, e futuramente
 * Despachante, Revenda, Montadora...) — nada aqui sabe o nome de uma
 * entidade específica. A entidade concedente chega pronta em
 * AcessoSuporteConcessaoDTO (entidade_tipo_id + entidade_id), resolvidos
 * pelo Controller da própria entidade a partir do seu próprio usuário
 * autenticado (ex: Private\AcessoSuporteController lê
 * Auth::user()->grupo->entidade_tipo_id/entidade_id).
 */
class AcessoSuporteService
{
    /**
     * Limite máximo, aplicado no backend independentemente do que o
     * cliente enviar — nunca é possível conceder (ou validar) um acesso
     * além deste teto.
     */
    public const DURACAO_MAXIMA_MINUTOS = 120;
    public const DURACAO_MINIMA_MINUTOS = 5;

    public function __construct(
        protected MensagemService $mensagemService,
    ) {}

    public function conceder(AcessoSuporteConcessaoDTO $dto): AcessoSuporte
    {
        return DB::transaction(function () use ($dto) {

            $entidadeTipo = EntidadeTipo::find($dto->entidade_tipo_id);

            if (!$entidadeTipo || $entidadeTipo->chave === EntidadeTipoEnum::ADMIN) {
                throw new BusinessException(
                    'Tipo de entidade concedente inválido.',
                    ErrorCode::ACESSO_SUPORTE_REQUIRED->value
                );
            }

            $admin = Usuario::with('grupo.entidadeTipo')->find($dto->usuario_admin_id);

            if (!$admin || $admin->grupo?->entidadeTipo?->chave->value !== EntidadeTipoEnum::ADMIN->value) {
                throw new BusinessException(
                    'O usuário selecionado não é um administrador válido.',
                    ErrorCode::ACESSO_SUPORTE_REQUIRED->value
                );
            }

            $jaExisteAtivo = AcessoSuporte::where('usuario_admin_id', $dto->usuario_admin_id)
                ->where('entidade_tipo_id', $dto->entidade_tipo_id)
                ->where('entidade_id', $dto->entidade_id)
                ->where('status', AcessoSuporteStatus::ATIVO)
                ->exists();

            if ($jaExisteAtivo) {
                throw new BusinessException(
                    'Já existe um acesso de suporte ativo para este administrador.',
                    ErrorCode::ACESSO_SUPORTE_REQUIRED->value
                );
            }

            $duracao = max(
                self::DURACAO_MINIMA_MINUTOS,
                min($dto->duracao_minutos, self::DURACAO_MAXIMA_MINUTOS)
            );

            $acesso = AcessoSuporte::create([
                'entidade_tipo_id' => $dto->entidade_tipo_id,
                'entidade_id' => $dto->entidade_id,
                'usuario_concedente_id' => $dto->usuario_concedente_id,
                'usuario_admin_id' => $dto->usuario_admin_id,
                'motivo' => $dto->motivo,
                'status' => AcessoSuporteStatus::ATIVO,
                'expira_em' => now()->addMinutes($duracao),
                'metadados' => $dto->metadados,
            ]);

            $acesso->setRelation('entidadeTipo', $entidadeTipo);

            $this->notificarAdmin($acesso, $entidadeTipo);

            return $acesso;
        });
    }

    /**
     * Reaproveita o sistema de mensagens já existente (MensagemService),
     * apenas com origem=SISTEMA (gerada automaticamente, não escrita
     * manualmente por um Admin) direcionada a um único usuário.
     */
    private function notificarAdmin(AcessoSuporte $acesso, EntidadeTipo $entidadeTipo): void
    {
        $entidade = $acesso->entidade();
        $nomeEntidade = $entidade?->nome ?? $entidadeTipo->chave->value;

        $this->mensagemService->cadastrar(
            MensagemCadastroDTO::criarParaCadastro([
                'titulo' => 'Acesso de suporte concedido',
                'conteudo' => sprintf(
                    '%s liberou o acesso ao seu usuário para realizar o suporte até %s.',
                    $nomeEntidade,
                    $acesso->expira_em->format('d/m/Y \à\s H:i')
                ),
                'direcionamento' => [
                    'tipo' => MensagemDirecionamentoTipo::USUARIO->value,
                    'usuario_id' => $acesso->usuario_admin_id,
                ],
            ]),
            MensagemOrigem::SISTEMA
        );
    }

    /**
     * Valida se um Acesso de Suporte pode ser usado AGORA, nesta requisição.
     * É o único caminho pelo qual uma requisição passa a ser considerada
     * "em modo de suporte" — chamado pelo AcessoSuporteMiddleware antes de
     * qualquer Controller/Service da entidade concedente rodar.
     *
     * A expiração é sempre recalculada aqui, contra o relógio do servidor —
     * nunca confiando em nada vindo do cliente/token.
     */
    public function validarAtiva(string $id, Usuario $admin): AcessoSuporte
    {
        $acesso = AcessoSuporte::with('entidadeTipo')->find($id);

        if (!$acesso || $acesso->usuario_admin_id !== $admin->id) {
            throw new BusinessException(
                'Acesso de suporte não encontrado.',
                ErrorCode::ACESSO_SUPORTE_NOT_FOUND->value
            );
        }

        if ($acesso->status === AcessoSuporteStatus::ATIVO && $acesso->expira_em->isPast()) {
            $acesso->update([
                'status' => AcessoSuporteStatus::EXPIRADO,
                'encerrado_em' => now(),
                'encerrado_por' => AcessoSuporteEncerradoPor::EXPIRACAO,
            ]);
        }

        if (!$acesso->estaValido()) {
            throw new BusinessException(
                match ($acesso->status) {
                    AcessoSuporteStatus::REVOGADO => 'O cliente revogou este acesso de suporte.',
                    AcessoSuporteStatus::EXPIRADO => 'Este acesso de suporte expirou.',
                    AcessoSuporteStatus::ENCERRADO => 'Este acesso de suporte já foi encerrado.',
                    default => 'Acesso de suporte inválido.',
                },
                ErrorCode::ACESSO_SUPORTE_UNAUTHORIZED->value
            );
        }

        if (!$acesso->iniciado_em) {
            $acesso->update(['iniciado_em' => now()]);
        }

        return $acesso;
    }

    public function revogar(string $id, Usuario $concedente): void
    {
        DB::transaction(function () use ($id, $concedente) {

            $acesso = AcessoSuporte::where('id', $id)
                ->where('usuario_concedente_id', $concedente->id)
                ->first();

            if (!$acesso) {
                throw new BusinessException(
                    'Acesso de suporte não encontrado.',
                    ErrorCode::ACESSO_SUPORTE_NOT_FOUND->value
                );
            }

            if ($acesso->status !== AcessoSuporteStatus::ATIVO) {
                return;
            }

            $acesso->update([
                'status' => AcessoSuporteStatus::REVOGADO,
                'encerrado_em' => now(),
                'encerrado_por' => AcessoSuporteEncerradoPor::CLIENTE,
            ]);
        });
    }

    public function encerrar(string $id, Usuario $admin): void
    {
        DB::transaction(function () use ($id, $admin) {

            $acesso = AcessoSuporte::where('id', $id)
                ->where('usuario_admin_id', $admin->id)
                ->first();

            if (!$acesso) {
                throw new BusinessException(
                    'Acesso de suporte não encontrado.',
                    ErrorCode::ACESSO_SUPORTE_NOT_FOUND->value
                );
            }

            if ($acesso->status !== AcessoSuporteStatus::ATIVO) {
                return;
            }

            $acesso->update([
                'status' => AcessoSuporteStatus::ENCERRADO,
                'encerrado_em' => now(),
                'encerrado_por' => AcessoSuporteEncerradoPor::ADMIN,
            ]);
        });
    }

    public function listarConcedidos(Usuario $concedente): Collection
    {
        return AcessoSuporte::with(['admin', 'entidadeTipo'])
            ->where('usuario_concedente_id', $concedente->id)
            ->latest('created_at')
            ->get();
    }

    public function listarRecebidos(Usuario $admin): Collection
    {
        return AcessoSuporte::with(['concedente', 'entidadeTipo'])
            ->where('usuario_admin_id', $admin->id)
            ->latest('created_at')
            ->get();
    }
}
