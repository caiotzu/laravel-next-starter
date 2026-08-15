<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;

use Illuminate\Support\Str;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;

use Jenssegers\Agent\Agent;

use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;

use App\Models\Usuario;

use App\Services\UsuarioService;
use App\Services\UsuarioSessaoService;
use App\Services\TokenResetSenhaService;
use App\Services\AutenticacaoDoisFatoresService;

use App\DTO\Usuario\UsuarioPrimeiroAcessoDTO;
use App\DTO\Usuario\UsuarioRedefinirSenhaDTO;
use App\DTO\UsuarioSessao\UsuarioSessaoCadastroDTO;
use App\DTO\UsuarioSessao\UsuarioSessaoAtualizacaoDTO;

use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\Verificar2faRequest;
use App\Http\Requests\Auth\EsqueceuSenhaRequest;
use App\Http\Requests\Auth\PrimeiroAcessoRequest;
use App\Http\Requests\Auth\RedefinirSenhaRequest;
use App\Http\Requests\Auth\RedefinirSenhaValidarRequest;
use App\Http\Requests\Auth\PrimeiroAcessoValidarRequest;

use App\Http\Resources\Admin\Auth\MeResource;
use App\Http\Resources\Admin\Auth\LoginResource;
use App\Http\Resources\Admin\Auth\LogoutResource;
use App\Http\Resources\Admin\Auth\RefreshResource;
use App\Http\Resources\Admin\Auth\EsqueceuSenhaResource;
use App\Http\Resources\Admin\Auth\LoginGoogle2FaEnableResource;
use App\Http\Resources\Admin\Auth\RedefinirSenhaValidarResource;
use App\Http\Resources\Admin\Auth\PrimeiroAcessoValidarResource;

use App\Exceptions\BusinessException;

use App\Enums\EntidadeTipo;

use OpenApi\Attributes as OA;

class AuthController extends Controller
{
    public function __construct(
        protected UsuarioService $usuarioService,
        protected UsuarioSessaoService $usuarioSessaoService,
        protected TokenResetSenhaService $tokenResetSenhaService,
        protected AutenticacaoDoisFatoresService $autenticacaoDoisFatoresService
    ) {}

    #[OA\Post(
        path: '/admin/login',
        summary: 'Admin — Login',
        description: 'Autentica um usuário da entidade Admin. Se o e-mail/senha forem válidos e o 2FA não estiver habilitado, retorna direto o token JWT. Se o 2FA estiver habilitado, retorna um temp_token para ser confirmado em /admin/2fa/verificar. Sujeito a rate limit (5 tentativas por e-mail+IP).',
        security: [],
        tags: ['Admin'],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(ref: '#/components/schemas/LoginRequestBody')),
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
    public function login(LoginRequest $request): JsonResponse
    {
        /**
         * Verifica o RateLimit, impossibilitando o usuário
         * de realizar múltiplas tentativas
         */
        $keyRateLimiter = 'login:'.$request->ip().':'.$request->email;

        try {
            if (RateLimiter::tooManyAttempts($keyRateLimiter, 5)) {
                throw new BusinessException(
                    'Muitas tentativas de login. Tente novamente em alguns minutos.'
                );
            }

            $usuario = $this->usuarioService->obterUsuarioAtivoPorEmail($request->email, EntidadeTipo::ADMIN);

            if (!$usuario || !Hash::check($request->senha, $usuario->senha)) {
                throw new BusinessException('Credenciais informadas são inválidas.');
            }

            if ($usuario->google2fa_enable) {
                $tempToken = Str::uuid()->toString();

                Cache::put(
                    "2fa_login:{$tempToken}",
                    $usuario->id,
                    now()->addMinutes(5)
                );

                return LoginGoogle2FaEnableResource::make([
                    '2fa_enable' => true,
                    'temp_token' => $tempToken
                ])->response()->setStatusCode(200);
            }

            RateLimiter::clear($keyRateLimiter);
            return $this->finalizarLogin($usuario, $request);

        } catch (BusinessException $e) {
            RateLimiter::hit($keyRateLimiter, 300);

            return response()->json([
                'errors' => ['business' => [$e->getMessage()]]
            ], 401);
        }
    }

    #[OA\Post(
        path: '/admin/2fa/verificar',
        summary: 'Admin — Confirmar código 2FA do login',
        description: 'Segunda etapa do login quando o usuário tem 2FA habilitado: confirma o código do Google Authenticator usando o temp_token retornado por /admin/login. Sujeito a rate limit (9 tentativas por IP).',
        security: [],
        tags: ['Admin'],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(ref: '#/components/schemas/Verificar2faRequestBody')),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Login concluído.',
                content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/LoginResponse', type: 'object')], type: 'object')
            ),
            new OA\Response(response: 422, ref: '#/components/responses/ValidationError'),
        ]
    )]
    public function verificar2fa(Verificar2faRequest $request): JsonResponse
    {
        /**
         * Verifica o RateLimit, impossibilitando o usuário
         * de realizar múltiplas tentativas
         */
        $keyRateLimiter = '2fa:'.$request->ip();

        try {
            if (RateLimiter::tooManyAttempts($keyRateLimiter, 9)) {
                throw new BusinessException(
                    'Muitas tentativas de login. Tente novamente em alguns minutos.'
                );
            }

            $userId = Cache::get("2fa_login:{$request->temp_token}");
            if (!$userId)
                throw new BusinessException('Token inválido ou expirado.');


            $usuario = $this->usuarioService->obterUsuarioAtivoPorId($userId, EntidadeTipo::ADMIN);

            if (!$usuario)
                throw new BusinessException('Credenciais inválidas.');


            if (!$usuario->google2fa_enable)
                throw new BusinessException('2FA não está ativo.');

            $valido = $this->autenticacaoDoisFatoresService->verificar(
                $usuario->google2fa_secret,
                $request->codigo
            );

            if (!$valido)
                throw new BusinessException('Código inválido.');

            Cache::forget("2fa_login:{$request->temp_token}");

            RateLimiter::clear($keyRateLimiter);
            return $this->finalizarLogin($usuario, $request);

        } catch (BusinessException $e) {
            RateLimiter::hit($keyRateLimiter, 300);

            return response()->json([
                'errors' => ['business' => [$e->getMessage()]]
            ], 422);
        }
    }

    private function finalizarLogin(Usuario $usuario, $request): JsonResponse
    {
        $agent = new Agent();
        $agent->setUserAgent($request->userAgent());

        $sessao = $this->usuarioSessaoService->cadastrar(
            UsuarioSessaoCadastroDTO::criarParaCadastro(
                $usuario->id,
                $request->ip(),
                $request->userAgent(),
                $agent->browser(),
                $agent->platform(),
                $agent->device()
            )
        );

        $customClaims = ['session_id' => $sessao->id];

        $token = JWTAuth::claims($customClaims)->fromUser($usuario);

        $this->usuarioService->registrarLogin($usuario, $request->ip());

        return LoginResource::make([
            '2fa_enable' => $usuario->google2fa_enable,
            'token' => $token,
            'expires_in' => JWTAuth::factory()->getTTL() * 60,
        ])->response()->setStatusCode(200);
    }

    #[OA\Post(
        path: '/admin/logout',
        summary: 'Admin — Logout',
        description: 'Invalida a sessão associada ao token JWT atual (a partir do session_id embutido no token) e invalida o próprio token no JWTAuth.',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Desconectado com sucesso.',
                content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/LogoutResponse', type: 'object')], type: 'object')
            ),
            new OA\Response(response: 400, ref: '#/components/responses/BusinessError'),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 500, ref: '#/components/responses/ServerError'),
        ]
    )]
    public function logout(): JsonResponse
    {
        try {

            $payload = JWTAuth::parseToken()->getPayload();
            $sessionId = $payload->get('session_id');

            if (!$sessionId) {
                throw new BusinessException('Sessão não encontrada no token.');
            }

            $dto = UsuarioSessaoAtualizacaoDTO::paraLogout($sessionId);

            $this->usuarioSessaoService->atualizar($dto);

            JWTAuth::invalidate(JWTAuth::getToken());

            return LogoutResource::make([
                'message' => 'Desconectado com sucesso'
            ])->response()->setStatusCode(200);

        } catch (BusinessException $e) {

            return response()->json([
                'errors' => ['business' => [$e->getMessage()]]
            ], 400);

        } catch (\Exception $e) {

            return response()->json([
                'errors' => ['business' => ['Não foi possível desconectar o usuário.']]
            ], 500);
        }
    }

    #[OA\Get(
        path: '/admin/me',
        summary: 'Admin — Dados do usuário autenticado',
        description: 'Retorna os dados do usuário administrativo autenticado, incluindo a lista de permissões (chaves) do seu grupo — usada pelo front-end para controle de acesso a telas/ações.',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Dados do usuário autenticado.',
                content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/MeResponse', type: 'object')], type: 'object')
            ),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
            new OA\Response(response: 500, ref: '#/components/responses/ServerError'),
        ]
    )]
    public function me(): JsonResponse
    {
        try {
            /** @var \App\Models\Usuario $user */
            $user = Auth::user();

            if (!$user) {
                return response()->json(['error' => 'User not found'], 404);
            }

            $user->load([
                'grupo.permissoes:id,chave'
            ]);

            $permissoes = $user->grupo
                ? $user->grupo->permissoes
                    ->pluck('chave')
                    ->values()
                : collect();

            return MeResource::make([
                'id' => $user->id,
                'nome' => $user->nome,
                'email' => $user->email,
                'avatar' => $user->avatar,
                'grupo' => $user->grupo->descricao,
                'status' => $user->status,
                'google2fa_enable' => $user->google2fa_enable,
                'google2fa_confirmado_em' => $user->google2fa_confirmado_em,
                'ultimo_login_em' => $user->ultimo_login_em,
                'ultimo_ip' => $user->ultimo_ip,
                'permissoes' => $permissoes
            ])->response()->setStatusCode(200);

        } catch (JWTException $e) {
            return response()->json([
                'errors' => ['business' => ['Não foi possível obter os dados do usuário autenticado']]
            ], 500);
        }
    }

    #[OA\Post(
        path: '/admin/refresh',
        summary: 'Admin — Renovar token JWT',
        description: 'Gera um novo token JWT a partir do token atual (ainda válido), estendendo a sessão sem exigir novo login.',
        security: [['bearerAuth' => []]],
        tags: ['Admin'],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Novo token gerado.',
                content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/RefreshResponse', type: 'object')], type: 'object')
            ),
            new OA\Response(response: 401, ref: '#/components/responses/Unauthorized'),
        ]
    )]
    public function refresh(): JsonResponse
    {
        return RefreshResource::make([
            'token' => JWTAuth::parseToken()->refresh(),
            'expires_in' => JWTAuth::factory()->getTTL() * 60
        ])->response()->setStatusCode(200);
    }

    #[OA\Get(
        path: '/admin/primeiro-acesso/validar',
        summary: 'Admin — Validar token de primeiro acesso',
        description: 'Valida um token de primeiro acesso (enviado por e-mail ao usuário recém-criado) antes de exibir o formulário de definição de senha.',
        security: [],
        tags: ['Admin'],
        parameters: [
            new OA\Parameter(name: 'token', description: 'Token de primeiro acesso recebido por e-mail.', in: 'query', required: true, schema: new OA\Schema(type: 'string')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Token válido.',
                content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/PrimeiroAcessoValidarResponse', type: 'object')], type: 'object')
            ),
            new OA\Response(response: 400, ref: '#/components/responses/BusinessError'),
            new OA\Response(response: 422, ref: '#/components/responses/ValidationError'),
        ]
    )]
    public function primeiroAcessoValidar(PrimeiroAcessoValidarRequest $request): JsonResponse
    {
        $token = $request->validated('token');
        $tokenResetSenha = $this->tokenResetSenhaService->validarToken($token);
        return PrimeiroAcessoValidarResource::make($tokenResetSenha)->response()->setStatusCode(200);
    }

    #[OA\Post(
        path: '/admin/primeiro-acesso',
        summary: 'Admin — Concluir primeiro acesso',
        description: 'Define a senha inicial do usuário a partir do token de primeiro acesso, ativando sua conta.',
        security: [],
        tags: ['Admin'],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(ref: '#/components/schemas/PrimeiroAcessoRequestBody')),
        responses: [
            new OA\Response(response: 204, ref: '#/components/responses/NoContent'),
            new OA\Response(response: 400, ref: '#/components/responses/BusinessError'),
            new OA\Response(response: 422, ref: '#/components/responses/ValidationError'),
        ]
    )]
    public function primeiroAcesso(PrimeiroAcessoRequest $request): JsonResponse
    {
        $this->usuarioService->primeiroAcesso(
            UsuarioPrimeiroAcessoDTO::criarParaPrimeiroAcesso(
                $request->validated()
            )
        );

        return response()->json(null, 204);
    }

    #[OA\Post(
        path: '/admin/esqueceu-senha',
        summary: 'Admin — Solicitar redefinição de senha',
        description: 'Dispara o e-mail de redefinição de senha, caso o e-mail informado esteja cadastrado. Sempre retorna a mesma mensagem genérica (200), independentemente de o e-mail existir ou não, para evitar enumeração de usuários.',
        security: [],
        tags: ['Admin'],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(ref: '#/components/schemas/EsqueceuSenhaRequestBody')),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Solicitação processada.',
                content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/EsqueceuSenhaResponse', type: 'object')], type: 'object')
            ),
            new OA\Response(response: 422, ref: '#/components/responses/ValidationError'),
        ]
    )]
    public function esqueceuSenha(EsqueceuSenhaRequest $request): JsonResponse
    {
        $this->usuarioService->esqueceuSenha($request->email, EntidadeTipo::ADMIN);

        return EsqueceuSenhaResource::make([
            'mensagem' =>'Se o e-mail estiver cadastrado, as instruções de redefinição serão enviadas.'
        ])->response()->setStatusCode(200);
    }

    #[OA\Get(
        path: '/admin/redefinir-senha/validar',
        summary: 'Admin — Validar token de redefinição de senha',
        description: 'Valida um token de redefinição de senha antes de exibir o formulário de nova senha.',
        security: [],
        tags: ['Admin'],
        parameters: [
            new OA\Parameter(name: 'token', description: 'Token de redefinição de senha recebido por e-mail.', in: 'query', required: true, schema: new OA\Schema(type: 'string')),
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Token válido.',
                content: new OA\JsonContent(properties: [new OA\Property(property: 'data', ref: '#/components/schemas/RedefinirSenhaValidarResponse', type: 'object')], type: 'object')
            ),
            new OA\Response(response: 400, ref: '#/components/responses/BusinessError'),
            new OA\Response(response: 422, ref: '#/components/responses/ValidationError'),
        ]
    )]
    public function redefinirSenhaValidar(RedefinirSenhaValidarRequest $request): JsonResponse
    {
        $token = $request->validated('token');
        $tokenResetSenha = $this->tokenResetSenhaService->validarToken($token);
        return RedefinirSenhaValidarResource::make($tokenResetSenha)->response()->setStatusCode(200);
    }

    #[OA\Post(
        path: '/admin/redefinir-senha',
        summary: 'Admin — Redefinir senha',
        description: 'Define uma nova senha a partir do token de redefinição de senha.',
        security: [],
        tags: ['Admin'],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(ref: '#/components/schemas/RedefinirSenhaRequestBody')),
        responses: [
            new OA\Response(response: 204, ref: '#/components/responses/NoContent'),
            new OA\Response(response: 400, ref: '#/components/responses/BusinessError'),
            new OA\Response(response: 422, ref: '#/components/responses/ValidationError'),
        ]
    )]
    public function redefinirSenha(RedefinirSenhaRequest $request): JsonResponse
    {
        $this->usuarioService->redefinirSenha(
            UsuarioRedefinirSenhaDTO::criarParaRedefinirSenha(
                $request->validated()
            )
        );

        return response()->json(null, 204);
    }
}
