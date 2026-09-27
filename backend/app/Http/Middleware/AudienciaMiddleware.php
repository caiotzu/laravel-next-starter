<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

use App\Enums\EntidadeTipo;
use App\AcessoSuporte\AcessoSuporteContexto;

/**
 * Garante que o usuário autenticado pertence à "audiência" (tipo de entidade do grupo)
 * esperada pela área da rota. Uso: ->middleware('audiencia:admin') / ->middleware('audiencia:private').
 *
 * O JwtMiddleware só prova que o token é válido, não QUEM é o usuário. Sem esta checagem,
 * um usuário de uma audiência alcança qualquer rota de outra audiência que não chame
 * authorize() (ex.: banners disponíveis, catálogo de permissões), o que é vazamento entre
 * audiências. Aplicado tanto na área Admin quanto na área Private, cada uma fechada por
 * padrão para quem não é da respectiva audiência.
 *
 * Exceção intencional: um Admin em modo de Acesso de Suporte (ver AcessoSuporteMiddleware /
 * AcessoSuporteContexto) usa as MESMAS rotas Private para atuar em nome da entidade
 * concedente — por isso, quando o contexto de suporte está ativo, a audiência efetiva é a
 * da entidade concedente (contexto->entidadeTipoChave()), não a do usuário autenticado.
 * Isso é seguro porque o contexto só fica ativo depois de o AcessoSuporteMiddleware validar
 * dono/expiração/status do acesso concedido.
 *
 * Deve rodar DEPOIS dos middlewares 'jwt' e 'suporte.contexto' (precisa do usuário
 * autenticado e, se aplicável, do contexto de suporte já validado).
 */
class AudienciaMiddleware
{
    public function __construct(
        protected AcessoSuporteContexto $contexto,
    ) {}

    public function handle(Request $request, Closure $next, string $audiencia): Response
    {
        $esperada = EntidadeTipo::tryFrom($audiencia);

        if ($this->contexto->ativo()) {
            $atual = $this->contexto->entidadeTipoChave();
        } else {
            $usuario = $request->user();
            $usuario?->loadMissing('grupo.entidadeTipo');
            $atual = $usuario?->grupo?->entidadeTipo?->chave?->value;
        }

        if (! $esperada || ! $atual || $atual !== $esperada->value) {
            return response()->json([
                'errors' => [
                    'business' => ['Você não tem permissão para executar esta ação.']
                ]
            ], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}
