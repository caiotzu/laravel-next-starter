<?php

namespace App\Http\Controllers\Admin;


use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

use Jenssegers\Agent\Agent;

use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;

use App\Services\UsuarioService;
use App\Services\UsuarioSessaoService;

use App\DTO\UsuarioSessao\UsuarioSessaoCadastroDTO;
use App\DTO\UsuarioSessao\UsuarioSessaoAtualizacaoDTO;

use App\Http\Requests\Auth\LoginRequest;

use App\Enums\EntidadeTipo;

use App\Exceptions\BusinessException;

class AuthController extends Controller
{
    public function __construct(
        protected UsuarioService $usuarioService,
        protected UsuarioSessaoService $usuarioSessaoService
    ) {}

    public function login(LoginRequest $request): JsonResponse
    {
        try {
            $usuario = $this->usuarioService->obterUsuarioAtivoPorEmail($request->email, EntidadeTipo::ADMIN);

            if (!$usuario || !Hash::check($request->senha, $usuario->senha)) {
                throw new BusinessException('Credenciais informadas são inválidas');
            }

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

            return response()->json([
                'token' => $token,
                'expires_in' => JWTAuth::factory()->getTTL() * 60,
            ]);

        } catch (BusinessException $e) {
            return response()->json([
                'errors' => ['business' => [$e->getMessage()]]
            ], 401);
        }
    }

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

            return response()->json([
                'message' => 'Desconectado com sucesso'
            ]);

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

            return response()->json([
                'id' => $user->id,
                'nome' => $user->nome,
                'email' => $user->email,
                'avatar' => $user->avatar,
                'grupo' => $user->grupo->descricao,
                'permissoes' => $permissoes
            ]);

        } catch (JWTException $e) {
            return response()->json([
                'errors' => ['business' => ['Não foi possível obter os dados do usuário autenticado']]
            ], 500);
        }
    }

    public function refresh(): JsonResponse
    {
        return response()->json([
            'token' => JWTAuth::parseToken()->refresh(),
            'expires_in' => JWTAuth::factory()->getTTL() * 60
        ]);
    }

    public function sessoes(): JsonResponse
    {
        $user = Auth::user();
        $sessoes = $this->usuarioService->listarSessoesAtivas($user);

        return response()->json($sessoes);
    }

    public function encerrarSessao(string $id): JsonResponse
    {
        $user = Auth::user();

        try {
            $this->usuarioService->encerrarSessao($user, $id);
            return response()->json(['message' => 'Sessão encerrada']);
        } catch (\Exception $e) {
            return response()->json([
                'errors' => ['business' => ['Não foi possível encerrar a sessão ('.$id.')']]
            ], 500);
        }
    }
}
