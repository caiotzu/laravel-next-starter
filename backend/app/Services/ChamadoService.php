<?php

namespace App\Services;

use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

use App\Models\Chamado;
use App\Models\ChamadoMensagem;
use App\Models\ChamadoAnexo;
use App\Models\Permissao;
use App\Models\Usuario;

use App\DTO\Chamado\ChamadoAberturaDTO;
use App\DTO\Chamado\ChamadoRespostaDTO;
use App\DTO\Chamado\ChamadoFiltroDTO;
use App\DTO\Mensagem\MensagemCadastroDTO;
use App\DTO\Mensagem\MensagemDirecionamentoDTO;

use App\Enums\ChamadoStatus;
use App\Enums\ErrorCode;
use App\Enums\MensagemDirecionamentoTipo;
use App\Enums\MensagemOrigem;

use App\Exceptions\BusinessException;

/**
 * Permissão usada tanto para autorizar o acesso à área de Chamados no
 * Admin quanto para resolver os destinatários da notificação automática
 * de abertura (ver notificarAdminsNovoChamado) — um único ponto de
 * verdade, evitando qualquer lista fixa de usuários.
 */
class ChamadoService
{
    private const PERMISSAO_ATENDER = 'admin.chamado.atender';

    public function abrir(ChamadoAberturaDTO $dto): Chamado
    {
        return DB::transaction(function () use ($dto) {
            $numero = DB::selectOne("SELECT nextval('chamados_ticket_seq') as numero")->numero;
            $ticket = sprintf('SUP-%d-%06d', now()->year, $numero);

            $chamado = Chamado::create([
                'ticket' => $ticket,
                'usuario_id' => $dto->usuario_id,
                'tipo' => $dto->tipo,
                'assunto' => $dto->assunto,
                'status' => ChamadoStatus::ABERTO,
                'aberto_em' => now(),
                'ultima_interacao_em' => now(),
            ]);

            $mensagem = $this->criarMensagem($chamado, $dto->usuario_id, $dto->mensagem, $dto->anexos);

            DB::afterCommit(fn () => $this->notificarAdminsNovoChamado($chamado));

            return $chamado->load(['usuario', 'mensagens.anexos', 'mensagens.usuario']);
        });
    }

    public function responder(string $chamadoId, ChamadoRespostaDTO $dto): ChamadoMensagem
    {
        return DB::transaction(function () use ($chamadoId, $dto) {
            $chamado = Chamado::lockForUpdate()->findOrFail($chamadoId);

            if ($chamado->status->bloqueiaMensagens()) {
                throw new BusinessException(
                    'Este chamado não aceita novas mensagens no status atual.',
                    ErrorCode::CHAMADO_ENCERRADO->value
                );
            }

            $ehCliente = $chamado->usuario_id === $dto->usuario_id;

            $chamadoMensagem = $this->criarMensagem($chamado, $dto->usuario_id, $dto->mensagem, $dto->anexos);

            $atualizacoes = ['ultima_interacao_em' => now()];

            if (! $ehCliente && ! $chamado->primeira_resposta_em) {
                $atualizacoes['primeira_resposta_em'] = now();
            }

            // Transição simples e previsível: quem responde "devolve a bola"
            // para o outro lado. Mudanças de status explícitas (resolvido,
            // fechado, cancelado) são feitas via atualizarStatus().
            $atualizacoes['status'] = $ehCliente
                ? ChamadoStatus::AGUARDANDO_SUPORTE
                : ChamadoStatus::AGUARDANDO_CLIENTE;

            $chamado->update($atualizacoes);

            DB::afterCommit(function () use ($chamado, $ehCliente) {
                $ehCliente
                    ? $this->notificarAdminsNovaResposta($chamado)
                    : $this->notificarClienteNovaResposta($chamado);
            });

            return $chamadoMensagem;
        });
    }

    public function atualizarStatus(string $chamadoId, ChamadoStatus $status): Chamado
    {
        $chamado = Chamado::findOrFail($chamadoId);

        $dados = ['status' => $status];

        if ($status->estaEncerrado() && ! $chamado->fechado_em) {
            $dados['fechado_em'] = now();
        }

        $chamado->update($dados);

        return $chamado->fresh();
    }

    public function atribuirResponsavel(string $chamadoId, ?string $responsavelId): Chamado
    {
        $chamado = Chamado::findOrFail($chamadoId);
        $chamado->update(['responsavel_id' => $responsavelId]);

        return $chamado->fresh(['responsavel']);
    }

    public function listarPrivate(string $usuarioId, ChamadoFiltroDTO $filtro): LengthAwarePaginator
    {
        $query = Chamado::where('usuario_id', $usuarioId)
            ->latest('ultima_interacao_em');

        $this->aplicarFiltros($query, $filtro);

        return $query->paginate($filtro->paginacao->por_pagina);
    }

    public function listarAdmin(ChamadoFiltroDTO $filtro): LengthAwarePaginator
    {
        $query = Chamado::with(['usuario', 'responsavel'])
            ->latest('ultima_interacao_em');

        $this->aplicarFiltros($query, $filtro);

        return $query->paginate($filtro->paginacao->por_pagina);
    }

    public function visualizarPrivate(string $id, string $usuarioId): Chamado
    {
        // Mesmo padrão de "não encontrado" já usado no resto do projeto
        // (ver ReleaseService::buscarPublicada): firstOrFail() dispara
        // ModelNotFoundException, mapeada para 404 pelo exception handler
        // global — diferente de BusinessException, que sempre responde 400.
        return Chamado::where('id', $id)
            ->where('usuario_id', $usuarioId)
            ->with(['mensagens' => fn ($q) => $q->orderBy('created_at'), 'mensagens.usuario', 'mensagens.anexos'])
            ->firstOrFail();
    }

    public function visualizarAdmin(string $id): Chamado
    {
        return Chamado::with([
                'usuario',
                'responsavel',
                'mensagens' => fn ($q) => $q->orderBy('created_at'),
                'mensagens.usuario',
                'mensagens.anexos',
            ])
            ->findOrFail($id);
    }

    private function aplicarFiltros($query, ChamadoFiltroDTO $filtro): void
    {
        if ($filtro->status) {
            $query->where('status', $filtro->status);
        }

        if ($filtro->tipo) {
            $query->where('tipo', $filtro->tipo);
        }
    }

    /**
     * @param array{nome: string, conteudo: string}[] $anexos
     */
    private function criarMensagem(Chamado $chamado, string $usuarioId, string $mensagem, array $anexos): ChamadoMensagem
    {
        $chamadoMensagem = ChamadoMensagem::create([
            'chamado_id' => $chamado->id,
            'usuario_id' => $usuarioId,
            'mensagem' => $mensagem,
        ]);

        foreach ($anexos as $anexo) {
            $decodificado = base64_decode($anexo['conteudo']);
            $mime = finfo_buffer(finfo_open(FILEINFO_MIME_TYPE), $decodificado);

            $extensao = match ($mime) {
                'application/pdf' => 'pdf',
                'image/jpeg' => 'jpg',
                'image/png' => 'png',
                default => 'bin',
            };

            $caminho = 'chamados/' . $chamado->id . '/' . Str::uuid() . '.' . $extensao;

            Storage::disk('public')->put($caminho, $decodificado);

            ChamadoAnexo::create([
                'chamado_mensagem_id' => $chamadoMensagem->id,
                'nome_original' => $anexo['nome'],
                'caminho' => $caminho,
                'mime_type' => $mime,
                'tamanho' => strlen($decodificado),
            ]);
        }

        return $chamadoMensagem->load('anexos');
    }

    private function notificarAdminsNovoChamado(Chamado $chamado): void
    {
        $permissaoId = Permissao::where('chave', self::PERMISSAO_ATENDER)->value('id');

        if (! $permissaoId) {
            return;
        }

        app(MensagemService::class)->cadastrar(
            MensagemCadastroDTO::criarParaCadastro([
                'titulo' => "Novo chamado: {$chamado->ticket}",
                'conteudo' => "Um novo chamado foi aberto — {$chamado->assunto}.",
                'direcionamento' => [
                    'tipo' => MensagemDirecionamentoTipo::PERMISSAO->value,
                    'permissao_id' => $permissaoId,
                ],
            ]),
            MensagemOrigem::SISTEMA
        );
    }

    private function notificarAdminsNovaResposta(Chamado $chamado): void
    {
        // Se já existe um responsável definido, só ele é notificado —
        // caso contrário, mesma regra da abertura (todo ADMIN com a
        // permissão de atender).
        if ($chamado->responsavel_id) {
            app(MensagemService::class)->cadastrar(
                MensagemCadastroDTO::criarParaCadastro([
                    'titulo' => "Nova resposta no chamado {$chamado->ticket}",
                    'conteudo' => "O cliente respondeu ao chamado \"{$chamado->assunto}\".",
                    'direcionamento' => [
                        'tipo' => MensagemDirecionamentoTipo::USUARIO->value,
                        'usuario_id' => $chamado->responsavel_id,
                    ],
                ]),
                MensagemOrigem::SISTEMA
            );
            return;
        }

        $this->notificarAdminsNovoChamado($chamado);
    }

    private function notificarClienteNovaResposta(Chamado $chamado): void
    {
        app(MensagemService::class)->cadastrar(
            MensagemCadastroDTO::criarParaCadastro([
                'titulo' => "Nova resposta no chamado {$chamado->ticket}",
                'conteudo' => "O suporte respondeu ao seu chamado \"{$chamado->assunto}\".",
                'direcionamento' => [
                    'tipo' => MensagemDirecionamentoTipo::USUARIO->value,
                    'usuario_id' => $chamado->usuario_id,
                ],
            ]),
            MensagemOrigem::SISTEMA
        );
    }
}
