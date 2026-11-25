<?php

namespace App\Http\Controllers\Private;

use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

use App\Services\AutenticacaoSocialService;

use App\Http\Requests\Auth\LoginSocialCallbackRequest;
use App\Http\Requests\Auth\LoginSocialVincularIniciarRequest;

use App\Http\Resources\Global\AutenticacaoSocial\LoginSocialIniciarResource;
use App\Http\Resources\Global\AutenticacaoSocial\VinculoSocialResource;

use App\Exceptions\BusinessException;

use App\Enums\EntidadeTipo;

use OpenApi\Attributes as OA;

/**
 * Perfil → aba "Login social": o usuário autenticado vê, vincula e desvincula as próprias contas
 * (Google...). Operações sobre o PRÓPRIO usuário (Auth::user()), como o restante do perfil.
 */
class PerfilLoginSocialController extends Controller
{
    public function __construct(
        protected AutenticacaoSocialService $autenticacaoSocialService,
    ) {}

    #[OA\Get(
        path: '/perfil/login-social',
        summary: 'Private — Listar contas de login social do perfil',
        description: 'Lista os provedores de login social disponíveis e se o usuário autenticado já vinculou a sua conta em cada um. Inclui vínculos de provedores hoje desativados (só podem ser removidos).',
        security: [['bearerAuth' => []]],
        tags: ['Private'],
        responses: [
            new OA\Response(response: 200, description: 'Provedores e vínculos.', content: new OA\JsonContent(properties: [
                new OA\Property(property: 'data', type: 'array', items: new OA\Items(ref: '#/components/schemas/VinculoSocial')),
            ], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
        ]
    )]
    public function listar(): JsonResponse
    {
        return VinculoSocialResource::collection(
            $this->autenticacaoSocialService->listarVinculos(Auth::user())
        )->response()->setStatusCode(200);
    }

    #[OA\Post(
        path: '/perfil/login-social/{provedor}/vincular/iniciar',
        summary: 'Private — Iniciar vínculo de conta social',
        description: 'Confere a senha atual e devolve a URL de autorização do provedor. O state fica preso ao usuário autenticado e ao navegador (binding).',
        security: [['bearerAuth' => []]],
        tags: ['Private'],
        parameters: [
            new OA\Parameter(name: 'provedor', description: 'Chave do provedor (ex.: google).', in: 'path', required: true, schema: new OA\Schema(type: 'string')),
        ],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(ref: '#/components/schemas/LoginSocialVincularIniciarRequestBody')),
        responses: [
            new OA\Response(
                response: 200,
                description: 'URL de autorização.',
                content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/LoginSocialIniciarResponse', type: 'object')], type: 'object')
            ),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 404, ref: '#/components/responses/BusinessError'),
            new OA\Response(response: 422, ref: '#/components/responses/ValidationError'),
            new OA\Response(response: 429, ref: '#/components/responses/BusinessError'),
        ]
    )]
    public function iniciarVinculo(LoginSocialVincularIniciarRequest $request, string $provedor): JsonResponse
    {
        try {
            $url = $this->autenticacaoSocialService->iniciarVinculo(
                Auth::user(),
                $provedor,
                EntidadeTipo::PRIVATE,
                $request->validated('senha'),
                $request->validated('binding'),
            );
        } catch (BusinessException $e) {
            return response()->json(['errors' => ['business' => [$e->getMessage()]]], $e->getStatusCode());
        }

        return LoginSocialIniciarResource::make(['url' => $url])->response()->setStatusCode(200);
    }

    #[OA\Post(
        path: '/perfil/login-social/{provedor}/vincular/callback',
        summary: 'Private — Concluir vínculo de conta social',
        description: 'Valida state/binding (do usuário autenticado), troca o code pela identidade do provedor e a associa ao usuário. Exige e-mail verificado no provedor; uma conta do provedor só pode pertencer a um usuário.',
        security: [['bearerAuth' => []]],
        tags: ['Private'],
        parameters: [
            new OA\Parameter(name: 'provedor', description: 'Chave do provedor (ex.: google).', in: 'path', required: true, schema: new OA\Schema(type: 'string')),
        ],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(ref: '#/components/schemas/LoginSocialCallbackRequestBody')),
        responses: [
            new OA\Response(response: 200, description: 'Conta vinculada.', content: new OA\JsonContent(properties: [
                new OA\Property(property: 'data', ref: '#/components/schemas/VinculoSocial', type: 'object'),
            ], type: 'object')),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 422, ref: '#/components/responses/ValidationError'),
        ]
    )]
    public function concluirVinculo(LoginSocialCallbackRequest $request, string $provedor): JsonResponse
    {
        $usuario = Auth::user();

        try {
            $this->autenticacaoSocialService->concluirVinculo(
                $usuario,
                $provedor,
                EntidadeTipo::PRIVATE,
                $request->validated('codigo'),
                $request->validated('state'),
                $request->validated('binding'),
            );
        } catch (BusinessException $e) {
            return response()->json(['errors' => ['business' => [$e->getMessage()]]], $e->getStatusCode());
        }

        return VinculoSocialResource::make(
            $this->autenticacaoSocialService->obterVinculo($usuario, $provedor)
        )->response()->setStatusCode(200);
    }

    #[OA\Delete(
        path: '/perfil/login-social/{provedor}',
        summary: 'Private — Desvincular conta social',
        description: 'Remove o vínculo do usuário autenticado com o provedor. O login por e-mail e senha não é afetado.',
        security: [['bearerAuth' => []]],
        tags: ['Private'],
        parameters: [
            new OA\Parameter(name: 'provedor', description: 'Chave do provedor (ex.: google).', in: 'path', required: true, schema: new OA\Schema(type: 'string')),
        ],
        responses: [
            new OA\Response(response: 204, ref: '#/components/responses/NoContent'),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 404, ref: '#/components/responses/NotFound'),
        ]
    )]
    public function desvincular(string $provedor): JsonResponse
    {
        try {
            $this->autenticacaoSocialService->desvincular(Auth::user(), $provedor);
        } catch (BusinessException $e) {
            return response()->json(['errors' => ['business' => [$e->getMessage()]]], $e->getStatusCode());
        }

        return response()->json(null, 204);
    }
}
