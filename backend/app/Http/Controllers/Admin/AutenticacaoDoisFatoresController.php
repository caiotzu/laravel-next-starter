<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

use App\Services\AutenticacaoDoisFatoresService;

use App\Http\Requests\Admin\AutenticacaoDoisFatores\HabilitarRequest;
use App\Http\Requests\Admin\AutenticacaoDoisFatores\ConfirmarRequest;
use App\Http\Requests\Admin\AutenticacaoDoisFatores\DesabilitarRequest;

use App\DTO\AutenticacaoDoisFatores\AutenticacaoDoisFatoresHabilitacaoDTO;
use App\DTO\AutenticacaoDoisFatores\AutenticacaoDoisFatoresConfirmacaoDTO;
use App\DTO\AutenticacaoDoisFatores\AutenticacaoDoisFatoresDesabilitacaoDTO;

use App\Http\Resources\Admin\Acoes\MensagemResource;
use App\Http\Resources\Admin\AutenticacaoDoisFatores\AutenticacaoDoisFatoresResource;

use OpenApi\Attributes as OA;

class AutenticacaoDoisFatoresController extends Controller
{
    public function __construct(
        protected AutenticacaoDoisFatoresService $autenticacaoDoisFatoresService
    ) {}

    #[OA\Post(
        path: '/admin/2fa/habilitar',
        summary: 'Admin — Iniciar habilitação do 2FA',
        description: 'Gera o secret TOTP e a URL otpauth para configurar o app autenticador. O 2FA só é efetivamente habilitado após a confirmação do código em /2fa/confirmar.',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(
            required: ['senha'],
            properties: [new OA\Property(property: 'senha', type: 'string', format: 'password', description: 'Senha atual do usuário, para confirmar a identidade antes de gerar o secret.')],
            type: 'object'
        )),
        responses: [
            new OA\Response(response: 200, description: 'Dados para configurar o app autenticador.', content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/AutenticacaoDoisFatoresHabilitarResponse', type: 'object')], type: 'object')),
            new OA\Response(response: 400, ref: '#/components/responses/BusinessError'),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 422, ref: '#/components/responses/ValidationError'),
        ]
    )]
    public function habilitar(HabilitarRequest $request): JsonResponse
    {
        /** @var \App\Models\Usuario $user */
        $user = Auth::user();


        $dto = new AutenticacaoDoisFatoresHabilitacaoDTO(
            usuario: $user,
            senha: $request->senha
        );

        $dados = $this->autenticacaoDoisFatoresService->habilitar($dto);

        return AutenticacaoDoisFatoresResource::make($dados)->response()->setStatusCode(200);
    }

    #[OA\Post(
        path: '/admin/2fa/confirmar',
        summary: 'Admin — Confirmar habilitação do 2FA',
        description: 'Confirma o código gerado pelo app autenticador, efetivando a habilitação do 2FA para o usuário.',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(
            required: ['codigo'],
            properties: [new OA\Property(property: 'codigo', type: 'string', pattern: '^[0-9]{6}$', example: '123456')],
            type: 'object'
        )),
        responses: [
            new OA\Response(response: 200, description: '2FA ativado com sucesso.', content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/AcaoMensagemResponse', type: 'object')], type: 'object')),
            new OA\Response(response: 400, ref: '#/components/responses/BusinessError'),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 422, ref: '#/components/responses/ValidationError'),
        ]
    )]
    public function confirmar(ConfirmarRequest $request): JsonResponse
    {
        /** @var \App\Models\Usuario $user */
        $user = Auth::user();

        $dto = new AutenticacaoDoisFatoresConfirmacaoDTO(
            usuario: $user,
            codigo: $request->codigo
        );

        $this->autenticacaoDoisFatoresService->confirmar($dto);

        return MensagemResource::make(['message'=> '2FA ativado com sucesso.'])->response()->setStatusCode(200);
    }

    #[OA\Delete(
        path: '/admin/2fa/desabilitar',
        summary: 'Admin — Desabilitar 2FA',
        description: 'Desabilita o 2FA do usuário autenticado, exigindo a senha atual e um código válido do app autenticador.',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(
            required: ['senha', 'codigo'],
            properties: [
                new OA\Property(property: 'senha', type: 'string', format: 'password'),
                new OA\Property(property: 'codigo', type: 'string', pattern: '^[0-9]{6}$', example: '123456'),
            ],
            type: 'object'
        )),
        responses: [
            new OA\Response(response: 200, description: '2FA desabilitado com sucesso.', content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/AcaoMensagemResponse', type: 'object')], type: 'object')),
            new OA\Response(response: 400, ref: '#/components/responses/BusinessError'),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 422, ref: '#/components/responses/ValidationError'),
        ]
    )]
    public function desabilitar(DesabilitarRequest $request): JsonResponse
    {
        /** @var \App\Models\Usuario $user */
        $user = Auth::user();

        $dto = new AutenticacaoDoisFatoresDesabilitacaoDTO(
            usuario: $user,
            senha: $request->senha,
            codigo: $request->codigo
        );

        $this->autenticacaoDoisFatoresService->desabilitar($dto);

        return MensagemResource::make(['message'=> '2FA desabilitado com sucesso.'])->response()->setStatusCode(200);
    }
}
