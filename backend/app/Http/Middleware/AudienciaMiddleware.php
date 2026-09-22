<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

use App\Enums\EntidadeTipo;

/**
 * Garante que o usuário autenticado pertence à "audiência" (tipo de entidade do grupo)
 * esperada pela área da rota. Uso: ->middleware('audiencia:admin').
 *
 * O JwtMiddleware só prova que o token é válido, não QUEM é o usuário. Sem esta checagem,
 * um usuário Private com JWT válido alcança qualquer rota /admin que não chame authorize()
 * (ex.: banners disponíveis, catálogo de permissões), o que é vazamento entre audiências.
 * Aqui a área Admin passa a ser fechada por padrão para quem não é Admin.
 *
 * Deve rodar DEPOIS do middleware 'jwt' (precisa do usuário autenticado).
 */
class AudienciaMiddleware
{
    public function handle(Request $request, Closure $next, string $audiencia): Response
    {
        $esperada = EntidadeTipo::tryFrom($audiencia);

        $usuario = $request->user();

        $usuario?->loadMissing('grupo.entidadeTipo');

        $atual = $usuario?->grupo?->entidadeTipo?->chave;

        if (! $esperada || ! $atual || $atual !== $esperada) {
            return response()->json([
                'errors' => [
                    'business' => ['Você não tem permissão para executar esta ação.']
                ]
            ], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}
