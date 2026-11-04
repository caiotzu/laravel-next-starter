<?php

namespace App\Http\Controllers\Lookup;

use App\Http\Controllers\Controller;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

use App\Services\UsuarioService;

use App\Models\Usuario;

use App\Enums\EntidadeTipo;
use App\Enums\UsuarioStatus;

use App\Http\Resources\Lookup\Administrador\AdministradorResource;

use OpenApi\Attributes as OA;

/**
 * Usado pela tela de concessão de Acesso de Suporte (cliente) para selecionar qual Admin
 * receberá o acesso, e pelos próprios administradores (ex.: atribuir responsável de chamado).
 * Só devolve administradores ativos, apenas id/nome/e-mail.
 *
 * SEC-008 / F-05: antes qualquer usuário autenticado (inclusive um cliente sem permissão
 * alguma) enumerava a equipe interna por tentativas de busca. Agora:
 *  - quem não é Admin precisa da permissão `private.acesso_suporte.conceder`;
 *  - para quem não é Admin a busca exige no mínimo 3 caracteres (sem busca, lista vazia)
 *    e o e-mail volta mascarado (`ad***@dominio.com`): o nome basta para escolher;
 *  - os curingas `%` e `_` da busca são tratados como texto (ver UsuarioRepository).
 */
class AdministradorController extends Controller
{
    /** Mínimo de caracteres da busca para quem não é Admin. */
    private const BUSCA_MINIMA_CLIENTE = 3;

    public function __construct(
        protected UsuarioService $usuarioService
    ) {}

    #[OA\Get(
        path: '/lookup/administradores',
        summary: 'Lookup — Listar administradores',
        description: 'Lista usuários administrativos ativos, para uso em seletores (ex: concessão de Acesso de Suporte). Busca opcional por nome/e-mail.',
        security: [['bearerAuth' => []]],
        tags: ['Lookup'],
        parameters: [
            new OA\Parameter(name: 'busca', description: 'Filtro por nome ou e-mail (busca parcial, case-insensitive).', in: 'query', schema: new OA\Schema(type: 'string', maxLength: 255)),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Lista de administradores.', content: new OA\JsonContent(properties: [new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/Administrador'))], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 403, ref: '#/components/responses/Forbidden'),
        ]
    )]
    public function listar(Request $request): JsonResponse
    {
        $usuario = $request->user();
        $usuario?->loadMissing('grupo.entidadeTipo');

        $ehAdmin = $usuario?->grupo?->entidadeTipo?->chave?->value === EntidadeTipo::ADMIN->value;

        if (! $ehAdmin) {
            $this->authorize('private.acesso_suporte.conceder');
        }

        $busca = trim((string) $request->query('busca', ''));
        $busca = $busca === '' ? null : mb_substr($busca, 0, 255);

        if (! $ehAdmin && mb_strlen((string) $busca) < self::BUSCA_MINIMA_CLIENTE) {
            return AdministradorResource::collection(collect())->response()->setStatusCode(200);
        }

        // Lido pelo AdministradorResource: só o Admin vê o e-mail completo.
        $request->attributes->set('mascarar_email', ! $ehAdmin);

        $administradores = $this->usuarioService->listarAdministradoresComAcessoSuporte($busca);

        return AdministradorResource::collection($administradores)->response()->setStatusCode(200);
    }
}
