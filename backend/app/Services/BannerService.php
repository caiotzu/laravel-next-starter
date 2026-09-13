<?php

namespace App\Services;

use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\ModelNotFoundException;

use App\Models\Banner;
use App\Models\BannerImagem;
use App\Models\BannerLink;
use App\Models\EntidadeTipo;

use App\DTO\Banner\BannerFiltroDTO;
use App\DTO\Banner\BannerCadastroDTO;
use App\DTO\Banner\BannerAtualizacaoDTO;
use App\DTO\Banner\BannerImagemAtualizacaoDTO;
use App\DTO\Common\PaginationDTO;

use App\Enums\ErrorCode;
use App\Enums\BannerStatus;
use App\Enums\BannerDirecionamentoTipo;
use App\Enums\EntidadeTipo as EntidadeTipoChave;

use App\Exceptions\BusinessException;

class BannerService
{
    /**
     * Tipos de imagem aceitos. Mesma abordagem de segurança do restante do
     * projeto (ver ChamadoService::criarMensagem): o tipo é sempre inferido
     * a partir dos BYTES reais do arquivo (finfo), nunca confiado a partir
     * do nome/MIME informado pelo cliente.
     */
    private const MIMES_IMAGEM_PERMITIDOS = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];

    // 5 MB por imagem.
    private const TAMANHO_MAXIMO_IMAGEM_BYTES = 5 * 1024 * 1024;

    private const MAXIMO_IMAGENS = 10;
    private const MAXIMO_LINKS = 10;

    /**
     * Listagem administrativa: sem restrição de status/período por padrão,
     * mesmo comportamento das demais listagens Admin (ver
     * ReleaseService::listarTodas) — quem gerencia banners precisa ver
     * tudo, inclusive inativos e fora do período, e filtra explicitamente
     * via querystring.
     */
    public function listar(BannerFiltroDTO $filtro): LengthAwarePaginator
    {
        return Banner::query()
            ->with(['entidadeTipo', 'imagens', 'links'])
            ->withCount('imagens')
            ->when($filtro->titulo, fn ($q) => $q->where('titulo', 'ilike', "%{$filtro->titulo}%"))
            ->when($filtro->status, fn ($q) => $q->where('status', $filtro->status->value))
            ->orderBy('created_at', 'DESC')
            ->paginate($filtro->paginacao->por_pagina);
    }

    public function visualizar(string $id): Banner
    {
        $banner = Banner::with(['entidadeTipo', 'imagens', 'links'])->find($id);

        if (! $banner) {
            throw new BusinessException('Banner não encontrado.', ErrorCode::BANNER_NOT_FOUND->value, 404);
        }

        return $banner;
    }

    public function cadastrar(BannerCadastroDTO $dto): Banner
    {
        $this->validarImagensObrigatorias($dto->imagens);

        return DB::transaction(function () use ($dto) {
            $entidadeTipoId = $this->resolverEntidadeTipoId($dto->direcionamento);

            $banner = Banner::create([
                'titulo' => $dto->titulo,
                'conteudo' => $dto->conteudo,
                'status' => BannerStatus::ATIVO->value,
                'direcionamento_tipo' => $dto->direcionamento->tipo->value,
                'entidade_tipo_id' => $entidadeTipoId,
                'inicio_em' => $dto->inicio_em,
                'fim_em' => $dto->fim_em,
            ]);

            foreach ($dto->imagens as $ordem => $imagem) {
                $this->armazenarImagem($banner, $imagem->nome, $imagem->conteudo, $ordem);
            }

            foreach ($dto->links as $ordem => $link) {
                BannerLink::create([
                    'banner_id' => $banner->id,
                    'nome' => $link->nome,
                    'url' => $link->url,
                    'ordem' => $ordem,
                ]);
            }

            return $banner->load(['entidadeTipo', 'imagens', 'links']);
        });
    }

    public function atualizar(BannerAtualizacaoDTO $dto): Banner
    {
        return DB::transaction(function () use ($dto) {
            $banner = Banner::find($dto->id);

            if (! $banner) {
                throw new BusinessException('Banner não encontrado para atualização.', ErrorCode::BANNER_NOT_FOUND->value, 404);
            }

            $entidadeTipoId = $this->resolverEntidadeTipoId($dto->direcionamento);

            $banner->update([
                'titulo' => $dto->titulo,
                'conteudo' => $dto->conteudo,
                'direcionamento_tipo' => $dto->direcionamento->tipo->value,
                'entidade_tipo_id' => $entidadeTipoId,
                'inicio_em' => $dto->inicio_em,
                'fim_em' => $dto->fim_em,
            ]);

            $this->sincronizarImagens($banner, $dto->imagens);
            $this->sincronizarLinks($banner, $dto->links);

            return $banner->load(['entidadeTipo', 'imagens', 'links']);
        });
    }

    public function ativar(string $id): Banner
    {
        return $this->atualizarStatus($id, BannerStatus::ATIVO);
    }

    public function desativar(string $id): Banner
    {
        return $this->atualizarStatus($id, BannerStatus::INATIVO);
    }

    public function excluir(string $id): void
    {
        $banner = Banner::find($id);

        if (! $banner) {
            throw new BusinessException('Banner não encontrado para exclusão.', ErrorCode::BANNER_NOT_FOUND->value, 404);
        }

        // Soft delete apenas no registro — as imagens permanecem no disco
        // e as linhas relacionadas permanecem no banco (mesmo padrão de
        // Mensagem/GrupoEmpresa), preservando o histórico caso o banner
        // precise ser auditado depois.
        $banner->delete();
    }

    /**
     * Consulta ÚNICA usada pelo Private: retorna somente os banners
     * elegíveis PARA AGORA e PARA ESTE CONTEXTO, já com imagens e links
     * carregados (evita N+1 e uma segunda viagem ao backend só para
     * imagens — ver item 12 do pedido). O backend é a única fonte de
     * verdade sobre elegibilidade (ver item 11): status, período e
     * direcionamento são todos resolvidos aqui, nunca no cliente.
     */
    public function disponiveisPara(EntidadeTipoChave $contexto): \Illuminate\Support\Collection
    {
        $entidadeTipo = EntidadeTipo::where('chave', $contexto->value)->first();

        return Banner::query()
            ->disponivelAgora()
            ->where(function ($q) use ($entidadeTipo) {
                $q->where('direcionamento_tipo', BannerDirecionamentoTipo::GERAL->value);

                if ($entidadeTipo) {
                    $q->orWhere(function ($q2) use ($entidadeTipo) {
                        $q2->where('direcionamento_tipo', BannerDirecionamentoTipo::ENTIDADE->value)
                            ->where('entidade_tipo_id', $entidadeTipo->id);
                    });
                }
            })
            ->with(['imagens', 'links'])
            ->orderBy('created_at', 'DESC')
            ->get();
    }

    private function atualizarStatus(string $id, BannerStatus $status): Banner
    {
        $banner = Banner::find($id);

        if (! $banner) {
            throw new BusinessException('Banner não encontrado.', ErrorCode::BANNER_NOT_FOUND->value, 404);
        }

        if ($banner->status !== $status) {
            $banner->update(['status' => $status->value]);
        }

        return $banner->load(['entidadeTipo', 'imagens', 'links']);
    }

    private function resolverEntidadeTipoId(\App\DTO\Banner\BannerDirecionamentoDTO $direcionamento): ?string
    {
        if ($direcionamento->tipo !== BannerDirecionamentoTipo::ENTIDADE) {
            return null;
        }

        $entidadeTipoId = EntidadeTipo::where('chave', $direcionamento->entidade_tipo?->value)->value('id');

        if (! $entidadeTipoId) {
            throw new BusinessException(
                'A entidade selecionada não foi encontrada.',
                ErrorCode::BANNER_DIRECIONAMENTO_INVALIDO->value
            );
        }

        return $entidadeTipoId;
    }

    /**
     * @param \App\DTO\Banner\BannerImagemDTO[] $imagens
     */
    private function validarImagensObrigatorias(array $imagens): void
    {
        if (count($imagens) === 0) {
            throw new BusinessException(
                'É obrigatório enviar ao menos uma imagem para o banner.',
                ErrorCode::BANNER_IMAGEM_INVALIDA->value,
                422
            );
        }

        if (count($imagens) > self::MAXIMO_IMAGENS) {
            throw new BusinessException(
                'O banner permite no máximo ' . self::MAXIMO_IMAGENS . ' imagens.',
                ErrorCode::BANNER_IMAGEM_INVALIDA->value,
                422
            );
        }
    }

    private function armazenarImagem(Banner $banner, ?string $nomeOriginal, string $conteudoBase64, int $ordem): BannerImagem
    {
        // Nome é só um rótulo para mensagens de erro — se o cliente não
        // enviar (ex.: imagem nova cujo File não trouxe nome, ou qualquer
        // outro caso além do fluxo normal do formulário), o sistema gera
        // um rótulo padrão em vez de falhar por causa de um dado que não é
        // a origem de verdade da imagem.
        $nomeOriginal = $nomeOriginal !== null && $nomeOriginal !== ''
            ? $nomeOriginal
            : 'Imagem ' . ($ordem + 1);

        $decodificado = base64_decode($conteudoBase64, true);

        if ($decodificado === false || $decodificado === '') {
            throw new BusinessException('Uma das imagens enviadas é inválida.', ErrorCode::BANNER_IMAGEM_INVALIDA->value, 422);
        }

        if (strlen($decodificado) > self::TAMANHO_MAXIMO_IMAGEM_BYTES) {
            throw new BusinessException(
                "A imagem \"{$nomeOriginal}\" excede o tamanho máximo permitido (5 MB).",
                ErrorCode::BANNER_IMAGEM_INVALIDA->value,
                422
            );
        }

        $mime = finfo_buffer(finfo_open(FILEINFO_MIME_TYPE), $decodificado);

        if (! isset(self::MIMES_IMAGEM_PERMITIDOS[$mime])) {
            throw new BusinessException(
                "A imagem \"{$nomeOriginal}\" não é um tipo de arquivo permitido. Envie JPEG, PNG ou WEBP.",
                ErrorCode::BANNER_IMAGEM_INVALIDA->value,
                422
            );
        }

        $extensao = self::MIMES_IMAGEM_PERMITIDOS[$mime];
        $caminho = 'banners/' . $banner->id . '/' . Str::uuid() . '.' . $extensao;

        Storage::disk('public')->put($caminho, $decodificado);

        return BannerImagem::create([
            'banner_id' => $banner->id,
            'caminho' => $caminho,
            'mime_type' => $mime,
            'tamanho' => strlen($decodificado),
            'ordem' => $ordem,
        ]);
    }

    /**
     * Reconcilia a lista de imagens enviada na atualização com o que já
     * existe no banco: mantém as existentes (atualizando só a `ordem`),
     * cria as novas (base64) e remove — registro E arquivo em disco — as
     * que não vieram mais na lista.
     *
     * @param BannerImagemAtualizacaoDTO[] $imagens
     */
    private function sincronizarImagens(Banner $banner, array $imagens): void
    {
        $idsRecebidos = collect($imagens)
            ->filter(fn (BannerImagemAtualizacaoDTO $imagem) => ! $imagem->ehNova())
            ->pluck('id')
            ->all();

        $imagensAtuais = $banner->imagens()->get();

        $totalFinal = count($imagens);
        if ($totalFinal === 0) {
            throw new BusinessException(
                'É obrigatório manter ao menos uma imagem no banner.',
                ErrorCode::BANNER_IMAGEM_INVALIDA->value,
                422
            );
        }

        if ($totalFinal > self::MAXIMO_IMAGENS) {
            throw new BusinessException(
                'O banner permite no máximo ' . self::MAXIMO_IMAGENS . ' imagens.',
                ErrorCode::BANNER_IMAGEM_INVALIDA->value,
                422
            );
        }

        // Remove as que não vieram mais na lista.
        foreach ($imagensAtuais as $imagemAtual) {
            if (! in_array($imagemAtual->id, $idsRecebidos, true)) {
                Storage::disk('public')->delete($imagemAtual->getRawOriginal('caminho'));
                $imagemAtual->delete();
            }
        }

        foreach ($imagens as $imagem) {
            if ($imagem->ehNova()) {
                $this->armazenarImagem($banner, $imagem->nome, $imagem->conteudo ?? '', $imagem->ordem);
                continue;
            }

            BannerImagem::where('id', $imagem->id)
                ->where('banner_id', $banner->id)
                ->update(['ordem' => $imagem->ordem]);
        }
    }

    /**
     * @param \App\DTO\Banner\BannerLinkAtualizacaoDTO[] $links
     */
    private function sincronizarLinks(Banner $banner, array $links): void
    {
        if (count($links) > self::MAXIMO_LINKS) {
            throw new BusinessException(
                'O banner permite no máximo ' . self::MAXIMO_LINKS . ' links.',
                ErrorCode::BANNER_IMAGEM_INVALIDA->value,
                422
            );
        }

        // Links não têm o mesmo custo/risco de reprocessar (não há arquivo
        // em disco envolvido), então a forma mais simples e correta de
        // sincronizar é substituir tudo dentro da própria transação.
        $banner->links()->delete();

        foreach ($links as $link) {
            BannerLink::create([
                'banner_id' => $banner->id,
                'nome' => $link->nome,
                'url' => $link->url,
                'ordem' => $link->ordem,
            ]);
        }
    }
}
