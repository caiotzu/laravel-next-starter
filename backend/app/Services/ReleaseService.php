<?php

namespace App\Services;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;

use App\Models\Release;
use App\Models\EntidadeTipo;

use App\DTO\Common\PaginationDTO;
use App\DTO\Release\ReleaseFiltroDTO;
use App\DTO\Release\ReleaseCadastroDTO;
use App\DTO\Release\ReleaseAtualizacaoDTO;

use App\Enums\ReleaseStatus;
use App\Enums\EntidadeTipo as EntidadeTipoChave;

use Illuminate\Database\Eloquent\ModelNotFoundException;

class ReleaseService
{
    /**
     * Listagem pública (Admin ou Private lendo "o que há de novo" na sua
     * própria área): sempre e apenas releases PUBLISHED do contexto do
     * chamador. O contexto nunca vem do cliente — é resolvido no
     * Controller a partir de qual guard/rota autenticou a requisição (ver
     * Private\ReleaseController::listar / Admin\ReleaseController::novidades),
     * então não há como um usuário Private enxergar releases do contexto
     * Admin nem manipulando a query string.
     */
    public function listarPublicadas(EntidadeTipoChave $contexto, PaginationDTO $paginacao): LengthAwarePaginator
    {
        $entidadeTipo = $this->resolverEntidadeTipo($contexto);

        return Release::where('entidade_tipo_id', $entidadeTipo->id)
            ->where('status', ReleaseStatus::PUBLISHED)
            ->latest('publicado_em')
            ->paginate($paginacao->por_pagina);
    }

    public function buscarPublicada(string $id, EntidadeTipoChave $contexto): Release
    {
        $entidadeTipo = $this->resolverEntidadeTipo($contexto);

        return Release::where('id', $id)
            ->where('entidade_tipo_id', $entidadeTipo->id)
            ->where('status', ReleaseStatus::PUBLISHED)
            ->firstOrFail();
    }

    /**
     * Última release publicada do contexto — usada para exibir "versão
     * atual" (ex: rodapé/menu). Independente do endpoint GET /version, que
     * reflete a versão de build da plataforma como um todo (ver
     * Global\VersionController) — este método reflete a versão da última
     * novidade divulgada NAQUELE contexto, podem ou não coincidir conforme
     * o uso que o time editorial fizer das Releases.
     */
    public function versaoAtual(EntidadeTipoChave $contexto): ?Release
    {
        $entidadeTipo = $this->resolverEntidadeTipo($contexto);

        return Release::where('entidade_tipo_id', $entidadeTipo->id)
            ->where('status', ReleaseStatus::PUBLISHED)
            ->latest('publicado_em')
            ->first();
    }

    /**
     * Listagem administrativa: sem restrição de status/contexto por
     * padrão (mesmo comportamento de outras listagens Admin como
     * Empresa/Grupo/Usuario — vê tudo, filtra explicitamente via query
     * string). Quem gerencia releases precisa ver rascunhos e releases de
     * qualquer contexto.
     */
    public function listarTodas(ReleaseFiltroDTO $filtro): LengthAwarePaginator
    {
        $query = Release::with('entidadeTipo')->latest('created_at');

        if ($filtro->contexto) {
            $entidadeTipo = $this->resolverEntidadeTipo($filtro->contexto);
            $query->where('entidade_tipo_id', $entidadeTipo->id);
        }

        if ($filtro->status) {
            $query->where('status', $filtro->status);
        }

        if ($filtro->tipo) {
            $query->where('tipo', $filtro->tipo);
        }

        return $query->paginate($filtro->paginacao->por_pagina);
    }

    public function obter(string $id): Release
    {
        return Release::with('entidadeTipo')->findOrFail($id);
    }

    public function criar(ReleaseCadastroDTO $dto): Release
    {
        $entidadeTipo = $this->resolverEntidadeTipo($dto->contexto);

        return Release::create([
            'entidade_tipo_id' => $entidadeTipo->id,
            'titulo' => $dto->titulo,
            'conteudo' => $dto->conteudo,
            'tipo' => $dto->tipo,
            'versao' => $dto->versao,
            'status' => ReleaseStatus::DRAFT,
        ]);
    }

    public function atualizar(string $id, ReleaseAtualizacaoDTO $dto): Release
    {
        $release = Release::findOrFail($id);

        $dados = array_filter([
            'titulo' => $dto->titulo,
            'conteudo' => $dto->conteudo,
            'tipo' => $dto->tipo,
            'versao' => $dto->versao,
        ], fn ($valor) => $valor !== null);

        if ($dto->contexto) {
            $dados['entidade_tipo_id'] = $this->resolverEntidadeTipo($dto->contexto)->id;
        }

        $release->update($dados);

        return $release;
    }

    public function publicar(string $id): Release
    {
        $release = Release::findOrFail($id);

        if ($release->status !== ReleaseStatus::PUBLISHED) {
            $release->update([
                'status' => ReleaseStatus::PUBLISHED,
                'publicado_em' => now(),
            ]);
        }

        return $release;
    }

    private function resolverEntidadeTipo(EntidadeTipoChave $chave): EntidadeTipo
    {
        $entidadeTipo = EntidadeTipo::where('chave', $chave->value)->first();

        if (!$entidadeTipo) {
            throw new ModelNotFoundException("Contexto '{$chave->value}' não encontrado em entidade_tipos.");
        }

        return $entidadeTipo;
    }
}
