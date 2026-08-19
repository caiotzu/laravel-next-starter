<?php

namespace App\Http\Controllers\Lookup;

use App\Http\Controllers\Controller;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

use App\Models\Usuario;

use App\Enums\EntidadeTipo;
use App\Enums\UsuarioStatus;

use App\Http\Resources\Lookup\Administrador\AdministradorResource;

use OpenApi\Attributes as OA;

/**
 * Usado pela tela de concessão de Acesso de Suporte (qualquer entidade
 * concedente) para o cliente selecionar qual Admin receberá o acesso.
 * Não expõe nada além de id/nome/email, e só de administradores ativos.
 */
class AdministradorController extends Controller
{
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
            new OA\Response(response: 200, description: 'Lista de administradores.'),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
        ]
    )]
    public function listar(Request $request): JsonResponse
    {
        $busca = $request->query('busca');

        $administradores = Usuario::query()
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
            ->orderBy('nome')
            ->limit(20)
            ->get();

        return AdministradorResource::collection($administradores)->response()->setStatusCode(200);
    }
}
