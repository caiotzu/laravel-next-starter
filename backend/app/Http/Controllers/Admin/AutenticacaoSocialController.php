<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;

use App\Services\LoginService;
use App\Services\AutenticacaoSocialService;

use App\Http\Requests\Auth\LoginSocialCallbackRequest;
use App\Http\Requests\Auth\LoginSocialIniciarRequest;

use App\Http\Resources\Admin\Auth\LoginResource;
use App\Http\Resources\Admin\Auth\LoginGoogle2FaEnableResource;
use App\Http\Resources\Global\AutenticacaoSocial\LoginSocialIniciarResource;
use App\Http\Resources\Global\AutenticacaoSocial\ProvedoresSociaisResource;

use App\Exceptions\BusinessException;

use App\Enums\EntidadeTipo;

use OpenApi\Attributes as OA;

class AutenticacaoSocialController extends Controller
{
    public function __construct(
        protected AutenticacaoSocialService $autenticacaoSocialService,
        protected LoginService $loginService,
    ) {}

    #[OA\Get(
        path: '/admin/login/social/provedores',
        summary: 'Admin — Provedores de login social disponíveis',
        description: 'Lista os provedores de login social ativos e configurados (ex.: Google). O frontend usa a lista para exibir os botões.',
        security: [],
        tags: ['Admin'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Provedores disponíveis (pode ser lista vazia).',
                content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/ProvedoresSociaisResponse', type: 'object')], type: 'object')
            ),
        ]
    )]
    public function provedores(): JsonResponse
    {
        return ProvedoresSociaisResource::make($this->autenticacaoSocialService->provedoresAtivos())
            ->response()->setStatusCode(200);
    }

    #[OA\Post(
        path: '/admin/login/social/{provedor}/iniciar',
        summary: 'Admin — Iniciar login social',
        description: 'Registra o state/PKCE e devolve a URL de autorização do provedor, para a qual o navegador deve ser redirecionado. O `binding` é um valor aleatório que o BFF também guarda em cookie httpOnly e reenvia no callback.',
        security: [],
        tags: ['Admin'],
        parameters: [
            new OA\Parameter(name: 'provedor', description: 'Chave do provedor (ex.: google).', in: 'path', required: true, schema: new OA\Schema(type: 'string')),
        ],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(ref: '#/components/schemas/LoginSocialIniciarRequestBody')),
        responses: [
            new OA\Response(
                response: 200,
                description: 'URL de autorização.',
                content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/LoginSocialIniciarResponse', type: 'object')], type: 'object')
            ),
            new OA\Response(response: 404, ref: '#/components/responses/BusinessError'),
            new OA\Response(response: 422, ref: '#/components/responses/ValidationError'),
        ]
    )]
    public function iniciar(LoginSocialIniciarRequest $request, string $provedor): JsonResponse
    {
        try {
            $url = $this->autenticacaoSocialService->iniciar($provedor, EntidadeTipo::ADMIN, $request->validated('binding'));
        } catch (BusinessException $e) {
            return response()->json(['errors' => ['business' => [$e->getMessage()]]], $e->getStatusCode());
        }

        return LoginSocialIniciarResource::make(['url' => $url])->response()->setStatusCode(200);
    }

    #[OA\Post(
        path: '/admin/login/social/{provedor}/callback',
        summary: 'Admin — Concluir login social',
        description: 'Valida state/binding, troca o code pela identidade do provedor e autentica SOMENTE um usuário Admin já cadastrado e ativo (nunca cria usuário). Se o usuário tem 2FA habilitado, retorna um temp_token para /admin/2fa/verificar; caso contrário, retorna o token JWT.',
        security: [],
        tags: ['Admin'],
        parameters: [
            new OA\Parameter(name: 'provedor', description: 'Chave do provedor (ex.: google).', in: 'path', required: true, schema: new OA\Schema(type: 'string')),
        ],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(ref: '#/components/schemas/LoginSocialCallbackRequestBody')),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Login concluído ou 2FA solicitado.',
                content: new OA\JsonContent(oneOf: [
                    new OA\Schema(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/LoginResponse', type: 'object')], type: 'object'),
                    new OA\Schema(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/Login2faRequiredResponse', type: 'object')], type: 'object'),
                ])
            ),
            new OA\Response(response: 401, ref: '#/components/responses/BusinessError'),
            new OA\Response(response: 422, ref: '#/components/responses/ValidationError'),
        ]
    )]
    public function callback(LoginSocialCallbackRequest $request, string $provedor): JsonResponse
    {
        try {
            $usuario = $this->autenticacaoSocialService->concluir(
                $provedor,
                EntidadeTipo::ADMIN,
                $request->validated('codigo'),
                $request->validated('state'),
                $request->validated('binding'),
                $request->ip(),
            );
        } catch (BusinessException $e) {
            return response()->json(['errors' => ['business' => [$e->getMessage()]]], $e->getStatusCode());
        }

        if ($usuario->google2fa_enable) {
            return LoginGoogle2FaEnableResource::make([
                '2fa_enable' => true,
                'temp_token' => $this->loginService->iniciarSegundoFator($usuario),
            ])->response()->setStatusCode(200);
        }

        return LoginResource::make(
            $this->loginService->emitirToken($usuario, $request)
        )->response()->setStatusCode(200);
    }
}
