<?php

namespace App\Repositories;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

use App\DTO\Usuario\UsuarioFiltroDTO;
use App\Enums\EntidadeTipo;
use App\Enums\UsuarioStatus;
use App\Models\Grupo;
use App\Models\Usuario;
use App\Support\EscopoEntidade;

/**
 * Acesso a dados de Usuario.
 *
 * Um usuário pertence a uma entidade através do grupo. Por isso os métodos "NoEscopo"
 * recebem um EscopoEntidade e filtram pelo grupo em UM só lugar — noEscopo(). Quem chama não
 * monta (nem consegue esquecer) o filtro de empresa.
 *
 * Os demais métodos NÃO têm dono por natureza e estão listados em
 * tests/Unit/RepositoriesEscopoTest.php:
 *  - lookups de autenticação (login, refresh, esqueci minha senha): ainda não há usuário
 *    autenticado, o tipo de entidade vem da audiência da rota (Admin/Private);
 *  - buscarClienteDoGrupo: ação de um Admin sobre usuários de clientes, autorizada por
 *    permissão administrativa na rota;
 *  - listarAdministradoresComPermissao: lookup exclusivo de administradores.
 *
 * Só acessa dados: regras (status permitido, tokens, eventos, transações) ficam no
 * UsuarioService.
 */
class UsuarioRepository
{

    /**
     * Único ponto onde o escopo é aplicado a Usuario: o grupo do usuário precisa ser do
     * escopo. Por padrão só grupos não excluídos; com `incluirGruposExcluidos`, também os
     * excluídos (listagem, exclusão e reativação enxergam usuários de grupos excluídos).
     */
    private function noEscopo(EscopoEntidade $escopo, bool $incluirGruposExcluidos = false): Builder
    {
        return Usuario::query()->whereHas(
            $incluirGruposExcluidos ? 'grupoComExcluidos' : 'grupo',
            fn (Builder $query) => $query
                ->where('entidade_tipo_id', $escopo->entidadeTipoId)
                ->where('entidade_id', $escopo->entidadeId)
        );
    }

    // ------------------------------------------------------------------------------------
    // Com escopo de entidade
    // ------------------------------------------------------------------------------------

    /**
     * Usuário do escopo cujo grupo NÃO está excluído.
     */
    public function buscarNoEscopo(EscopoEntidade $escopo, string $id): ?Usuario
    {
        return $this->noEscopo($escopo)->find($id);
    }

    public function buscarComGrupoNoEscopo(EscopoEntidade $escopo, string $id): ?Usuario
    {
        return $this->noEscopo($escopo)->with('grupo')->find($id);
    }

    /**
     * Usuário do escopo mesmo que o grupo dele tenha sido excluído (exclusão).
     */
    public function buscarComGrupoExcluidoNoEscopo(EscopoEntidade $escopo, string $id): ?Usuario
    {
        return $this->noEscopo($escopo, incluirGruposExcluidos: true)->find($id);
    }

    /**
     * Usuário excluído (soft delete) do escopo, mesmo que o grupo dele também tenha sido
     * excluído (reativação).
     */
    public function buscarExcluidoNoEscopo(EscopoEntidade $escopo, string $id): ?Usuario
    {
        return $this->noEscopo($escopo, incluirGruposExcluidos: true)->onlyTrashed()->find($id);
    }

    public function listarNoEscopo(EscopoEntidade $escopo, UsuarioFiltroDTO $filtro): LengthAwarePaginator
    {
        return $this->noEscopo($escopo, incluirGruposExcluidos: true)
            ->with('grupoComExcluidos')
            ->when($filtro->id, fn ($q) =>
                $q->where('id', $filtro->id)
            )
            ->when($filtro->nome, fn ($q) =>
                $q->where('nome', 'ilike', "%{$filtro->nome}%")
            )
            ->when($filtro->grupo_id, fn ($q) =>
                $q->where('grupo_id', $filtro->grupo_id)
            )
            ->when($filtro->excluido, fn ($q) =>
                $q->withTrashed()
            )
            ->orderBy('created_at', 'DESC')
            ->paginate($filtro->paginacao->por_pagina);
    }

    /**
     * Cria o usuário em um grupo que o Service JÁ validou no escopo (por isso o parâmetro é um
     * Grupo vindo de GrupoRepository, e não um id solto).
     */
    public function criarNoGrupo(Grupo $grupo, array $dados): Usuario
    {
        return Usuario::create(['grupo_id' => $grupo->id] + $dados);
    }

    // ------------------------------------------------------------------------------------
    // Sem escopo, por natureza (ver docblock da classe e RepositoriesEscopoTest)
    // ------------------------------------------------------------------------------------

    /**
     * Login: usuário ATIVO do tipo de entidade da rota, com o que o fluxo de autenticação
     * precisa carregado. Para clientes, o grupo-empresa do grupo precisa existir.
     */
    public function buscarAtivoPorEmail(string $email, EntidadeTipo $entidadeTipo): ?Usuario
    {
        return Usuario::with('grupo.entidadeTipo', 'grupo.grupoEmpresa')
            ->whereHas('grupo.entidadeTipo', function (Builder $query) use ($entidadeTipo) {
                $query->where('chave', $entidadeTipo->value);
            })
            ->where('email', $email)
            ->where('status', UsuarioStatus::ATIVO->value)
            ->when($entidadeTipo !== EntidadeTipo::ADMIN, function (Builder $query) {
                $query->whereHas('grupo', function (Builder $query) {
                    $query->where(function ($query) {
                        // Não é grupo_empresa, não precisa validar entidade
                        $query->whereHas('entidadeTipo', function ($query) {
                            $query->where('entidade_tabela', '!=', 'grupo_empresas');
                        })
                        // Ou é grupo_empresa e precisa existir
                        ->orWhereHas('grupoEmpresa');
                    });
                });
            })
            ->first();
    }

    /**
     * Refresh/2FA: usuário ATIVO do tipo de entidade da rota.
     */
    public function buscarAtivoPorId(string $id, EntidadeTipo $entidadeTipo): ?Usuario
    {
        return Usuario::with('grupo.entidadeTipo')
            ->whereHas('grupo.entidadeTipo', function (Builder $query) use ($entidadeTipo) {
                return $query->where('chave', $entidadeTipo->value);
            })
            ->where('id', $id)
            ->where('status', UsuarioStatus::ATIVO->value)
            ->first();
    }

    /**
     * Esqueci minha senha: usuário ATIVO ou CONVIDADO do tipo de entidade da rota.
     */
    public function buscarAtivoOuConvidadoPorEmail(string $email, EntidadeTipo $entidadeTipo): ?Usuario
    {
        return Usuario::with('grupo.entidadeTipo')
            ->whereHas('grupo.entidadeTipo', function (Builder $query) use ($entidadeTipo) {
                return $query->where('chave', $entidadeTipo->value);
            })
            ->where('email', $email)
            ->whereIn('status', [UsuarioStatus::ATIVO->value, UsuarioStatus::CONVIDADO->value])
            ->first();
    }

    /**
     * Ação de um Admin sobre usuários de clientes: o usuário precisa pertencer ao grupo
     * informado E esse grupo precisa ser de uma entidade do tipo Private. Sem essa restrição,
     * o {grupoId} vindo da URL permitiria alterar usuários do próprio tipo Admin.
     */
    public function buscarClienteDoGrupo(string $usuarioId, string $grupoId, bool $somenteAtivosOuConvidados = false): ?Usuario
    {
        return Usuario::where('grupo_id', $grupoId)
            ->whereHas('grupo.entidadeTipo', fn (Builder $query) =>
                $query->where('chave', EntidadeTipo::PRIVATE->value)
            )
            ->when($somenteAtivosOuConvidados, fn (Builder $query) =>
                $query->whereIn('status', [UsuarioStatus::ATIVO->value, UsuarioStatus::CONVIDADO->value])
            )
            ->find($usuarioId);
    }

    /**
     * Administradores ATIVOS cujo grupo tem ao menos uma das permissões informadas.
     *
     * @param string[] $chavesDePermissao
     */
    public function listarAdministradoresComPermissao(?string $busca, array $chavesDePermissao, int $limite = 20): Collection
    {
        return Usuario::query()
            ->whereHas('grupo.entidadeTipo', fn ($q) =>
                $q->where('chave', EntidadeTipo::ADMIN->value)
            )
            ->where('status', UsuarioStatus::ATIVO->value)
            ->when($busca, fn ($q) =>
                $q->where(fn ($sub) =>
                    $sub->where('nome', 'ilike', "%{$busca}%")
                        ->orWhere('email', 'ilike', "%{$busca}%")
                )
            )
            ->whereHas('grupo.permissoes', fn ($q) =>
                $q->whereIn('chave', $chavesDePermissao)
            )
            ->orderBy('nome')
            ->limit($limite)
            ->get();
    }
}
