<?php

namespace App\Services;

use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Builder;

use App\AcessoSuporte\AcessoSuporteContexto;

use App\Models\Usuario;

use App\Enums\EntidadeTipo;

use App\Exceptions\BusinessException;

/**
 * Serviço central de escopo por entidade.
 *
 * Fica logo acima do App\AcessoSuporte\AcessoSuporteContexto (fonte da
 * verdade sobre qual entidade está em uso na requisição atual, inclusive
 * em modo de suporte) e é o ÚNICO lugar do sistema que decide, para o
 * usuário autenticado atual:
 *
 *   1) se a operação deve ser IRRESTRITA (não filtrar nada) ou RESTRITA
 *      (filtrar por uma entidade específica);
 *   2) qual é o entidade_id efetivo a ser usado quando a operação for
 *      restrita.
 *
 * Os Services que hoje possuem uma entidade "dona" dos seus registros
 * (EmpresaService, EmpresaContatoService, EmpresaEnderecoService — todos
 * via grupo_empresa_id) usam este serviço em vez de reimplementar a mesma
 * regra cada um por conta própria (antigo aplicarEscopoEntidade()
 * duplicado nos três). Nem esses Services nem os Controllers que os
 * chamam precisam mais saber, em nenhum momento, se o usuário atual é
 * Admin ou Private — isso é decidido inteiramente aqui.
 *
 * Regra de negócio aplicada (ver irrestrito()):
 *
 *  - Admin FORA de modo de suporte
 *      → irrestrito() = true.
 *      → aplicar() não adiciona nenhum filtro à query.
 *      → validarPertence() nunca rejeita (Admin pode inserir/atualizar
 *        apontando para qualquer entidade).
 *      → É o único caso em que a operação é, de fato, irrestrita.
 *
 *  - Admin EM modo de suporte (AcessoSuporteContexto::ativo() === true)
 *      → irrestrito() = false.
 *      → O contexto efetivo passa a ser o da entidade concedente
 *        impersonada (ex: Private X), nunca o do Admin real — exatamente
 *        o que AcessoSuporteContexto::entidadeId() já resolve.
 *      → aplicar()/validarPertence() passam a restringir à entidade
 *        impersonada, do mesmo jeito que restringiriam um Private comum.
 *
 *  - Private
 *      → irrestrito() = false.
 *      → Contexto = o do próprio grupo do usuário autenticado
 *        (AcessoSuporteContexto também cobre esse caso, retornando
 *        usuarioAutenticado->grupo->entidade_id quando não há suporte
 *        ativo).
 *
 *  - Sem usuário autenticado (Job, comando Artisan, seeder, login, etc.)
 *      → irrestrito() = false e entidadeIdAtual() = null.
 *      → Nenhuma rotina fora do HTTP autenticado chama este serviço hoje
 *        (EmpresaService/EmpresaContatoService/EmpresaEnderecoService só
 *        são usados a partir de Controllers). Este caso existe apenas
 *        como salvaguarda: se algum dia um desses Services passar a ser
 *        chamado fora de uma requisição autenticada, o resultado será
 *        "nenhuma linha visível" (where grupo_empresa_id = null) em vez
 *        de um erro fatal por tentar acessar propriedades de um usuário
 *        inexistente.
 */
class EscopoEntidadeService
{
    public function __construct(
        protected AcessoSuporteContexto $contexto,
    ) {}

    /**
     * Usuário autenticado da requisição atual, ou null fora de um
     * contexto HTTP autenticado (ver classe acima).
     */
    public function usuarioAutenticado(): ?Usuario
    {
        return Auth::user();
    }

    /**
     * true somente para um Admin fora de modo de suporte — o único caso
     * em que a operação deve ignorar completamente o escopo de entidade.
     */
    public function irrestrito(): bool
    {
        $usuario = $this->usuarioAutenticado();

        if (!$usuario) {
            return false;
        }

        // Em modo de suporte o contexto efetivo é sempre o da entidade
        // impersonada, então mesmo um Admin real deixa de ser irrestrito.
        if ($this->contexto->ativo()) {
            return false;
        }

        $usuario->loadMissing('grupo.entidadeTipo');

        return $usuario->grupo?->entidadeTipo?->chave === EntidadeTipo::ADMIN;
    }

    /**
     * entidade_id (grupo_empresas.id) a usar para restringir a operação
     * atual. Null quando a operação é irrestrita ou quando não há usuário
     * autenticado.
     */
    public function entidadeIdAtual(): ?string
    {
        $usuario = $this->usuarioAutenticado();

        if (!$usuario || $this->irrestrito()) {
            return null;
        }

        return $this->contexto->entidadeId($usuario);
    }

    /**
     * Aplica o escopo de entidade a uma query.
     *
     * Admin fora de suporte: retorna a query sem alterações.
     * Todos os outros casos (Private, Admin em suporte, sem usuário):
     * restringe pela coluna informada (por padrão grupo_empresa_id).
     */
    public function aplicar(Builder $query, string $coluna = 'grupo_empresa_id'): Builder
    {
        if ($this->irrestrito()) {
            return $query;
        }

        return $query->where($coluna, $this->entidadeIdAtual());
    }

    /**
     * Valida que um valor recebido em um payload de inserção/atualização
     * (ex: grupo_empresa_id enviado manualmente pelo cliente) pertence ao
     * escopo atual — impedindo que um Private (ou um Admin em modo de
     * suporte) manipule o payload para apontar para outra entidade.
     *
     * Admin fora de suporte nunca é rejeitado aqui (irrestrito).
     */
    public function validarPertence(?string $valorRecebido, string $mensagem, int $codigoErro): void
    {
        if ($this->irrestrito()) {
            return;
        }

        if ($valorRecebido === null || $valorRecebido !== $this->entidadeIdAtual()) {
            throw new BusinessException($mensagem, $codigoErro);
        }
    }

    /**
     * entidade_tipo_id/entidade_id a gravar automaticamente ao criar um
     * novo Grupo quando eles não foram informados explicitamente (ver
     * App\Models\Grupo::booted()). Usa a mesma fonte central
     * (AcessoSuporteContexto) que aplicar()/validarPertence(), portanto
     * também respeita corretamente o modo de suporte: um Admin em suporte
     * cria o Grupo no contexto da entidade impersonada, nunca no do
     * próprio Admin — diferente do escopo de aplicar()/validarPertence(),
     * aqui o resultado é sempre o contexto atual (inclusive para Admin
     * fora de suporte, que deve gravar seu próprio contexto Admin, e não
     * um valor nulo/irrestrito).
     *
     * Retorna null quando não há usuário autenticado (ver classe acima).
     */
    public function contextoParaCriacaoAutomatica(): ?array
    {
        $usuario = $this->usuarioAutenticado();

        if (!$usuario) {
            return null;
        }

        return [
            'entidade_tipo_id' => $this->contexto->entidadeTipoId($usuario),
            'entidade_id' => $this->contexto->entidadeId($usuario),
        ];
    }
}
