<?php

namespace App\Enums;

enum ChamadoStatus: string
{
    case ABERTO = 'aberto';
    case EM_ATENDIMENTO = 'em_atendimento';
    case AGUARDANDO_CLIENTE = 'aguardando_cliente';
    case AGUARDANDO_SUPORTE = 'aguardando_suporte';
    case RESOLVIDO = 'resolvido';
    case FECHADO = 'fechado';
    case CANCELADO = 'cancelado';

    public function label(): string
    {
        return match ($this) {
            self::ABERTO => 'Aberto',
            self::EM_ATENDIMENTO => 'Em atendimento',
            self::AGUARDANDO_CLIENTE => 'Aguardando cliente',
            self::AGUARDANDO_SUPORTE => 'Aguardando suporte',
            self::RESOLVIDO => 'Resolvido',
            self::FECHADO => 'Fechado',
            self::CANCELADO => 'Cancelado',
        };
    }

    /**
     * Status que "fecham" o chamado de fato — preenchem fechado_em (ver
     * ChamadoService::atualizarStatus). Resolvido NÃO entra aqui: um
     * chamado resolvido ainda não foi formalmente fechado pelo suporte.
     */
    public function estaEncerrado(): bool
    {
        return in_array($this, [self::FECHADO, self::CANCELADO], true);
    }

    /**
     * Status que bloqueiam o envio de novas mensagens (ver
     * ChamadoService::responder). Além dos que encerram o chamado,
     * Resolvido também bloqueia — a conversa é considerada concluída,
     * mesmo que o suporte ainda não tenha fechado o chamado formalmente.
     */
    public function bloqueiaMensagens(): bool
    {
        return in_array($this, [self::RESOLVIDO, self::FECHADO, self::CANCELADO], true);
    }

    /**
     * Cases considerados encerrados, derivados de estaEncerrado() — único
     * ponto de verdade. Usado por quem precisa da lista completa (ex.:
     * DashboardService), em vez de duplicar [FECHADO, CANCELADO] em outro
     * lugar.
     *
     * @return self[]
     */
    public static function encerrados(): array
    {
        return array_filter(self::cases(), fn (self $status) => $status->estaEncerrado());
    }

    /**
     * Mesma lista de encerrados(), já como valores string — formato
     * pronto para uso em whereIn()/whereNotIn().
     *
     * @return string[]
     */
    public static function encerradosValues(): array
    {
        return array_map(fn (self $status) => $status->value, self::encerrados());
    }
}
