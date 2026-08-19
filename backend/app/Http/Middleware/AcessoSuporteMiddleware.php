<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

use App\AcessoSuporte\AcessoSuporteContexto;
use App\Services\AcessoSuporteService;
use App\Exceptions\BusinessException;

/**
 * Roda logo após o middleware `jwt` em TODAS as rotas autenticadas (mesmo
 * grupo de rotas Admin + Private, ver routes/api.php).
 *
 * Comportamento:
 *  - Sem o header X-Acesso-Suporte-Id: não faz nada. Todo o fluxo normal de
 *    Admin e Private continua exatamente como era antes desta feature.
 *  - Com o header: valida o Acesso de Suporte (dono, expiração, status) e,
 *    se válido, ativa o AcessoSuporteContexto para o restante da requisição.
 *    Só a partir daqui os Services passam a enxergar a entidade concedente
 *    autorizada em vez da do próprio Admin (que nem possui uma entidade
 *    concedente própria — ver AcessoSuporteContexto). Funciona da mesma
 *    forma independente de qual entidade concedeu o acesso (Private,
 *    Despachante, Revenda...) — nada aqui é específico de uma entidade.
 *
 * Não altera Auth::user() em nenhum momento.
 */
class AcessoSuporteMiddleware
{
    public function __construct(
        protected AcessoSuporteService $acessoSuporteService,
        protected AcessoSuporteContexto $contexto,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $acessoSuporteId = $request->header('X-Acesso-Suporte-Id');

        if (!$acessoSuporteId) {
            return $next($request);
        }

        try {
            $admin = $request->user();

            $acesso = $this->acessoSuporteService->validarAtiva($acessoSuporteId, $admin);

            $this->contexto->ativar($acesso);

        } catch (BusinessException $e) {

            return response()->json([
                'errors' => [
                    'business' => [$e->getMessage()]
                ]
            ], 403);
        }

        return $next($request);
    }
}
