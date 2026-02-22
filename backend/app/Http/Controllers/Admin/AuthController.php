<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;

use Illuminate\Support\Str;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;

use Jenssegers\Agent\Agent;

use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;

use App\Models\Usuario;

use App\Services\UsuarioService;
use App\Services\UsuarioSessaoService;
use App\Services\AutenticacaoDoisFatoresService;

use App\DTO\UsuarioSessao\UsuarioSessaoCadastroDTO;
use App\DTO\UsuarioSessao\UsuarioSessaoAtualizacaoDTO;

use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\Verificar2faRequest;

use App\Enums\EntidadeTipo;

use App\Exceptions\BusinessException;

class AuthController extends Controller
{
    public function __construct(
        protected UsuarioService $usuarioService,
        protected UsuarioSessaoService $usuarioSessaoService,
        protected AutenticacaoDoisFatoresService $autenticacaoDoisFatoresService
    ) {}

    public function login(LoginRequest $request): JsonResponse
    {
        try {
            $usuario = $this->usuarioService->obterUsuarioAtivoPorEmail($request->email, EntidadeTipo::ADMIN);

            if (!$usuario || !Hash::check($request->senha, $usuario->senha)) {
                throw new BusinessException('Credenciais informadas são inválidas');
            }

            if ($usuario->google2fa_enable) {
                $tempToken = Str::uuid()->toString();

                Cache::put(
                    "2fa_login:{$tempToken}",
                    $usuario->id,
                    now()->addMinutes(5)
                );

                return response()->json([
                    '2fa_enable' => true,
                    'temp_token' => $tempToken
                ]);
            }

            return $this->finalizarLogin($usuario, $request);

        } catch (BusinessException $e) {
            return response()->json([
                'errors' => ['business' => [$e->getMessage()]]
            ], 401);
        }
    }

    public function verificar2fa(Verificar2faRequest $request): JsonResponse
    {
        try {

            $userId = Cache::get("2fa_login:{$request->temp_token}");
            if (!$userId)
                throw new BusinessException('Token inválido ou expirado');


            $usuario = $this->usuarioService->obterUsuarioAtivoPorId($userId, EntidadeTipo::ADMIN);

            if (!$usuario)
                throw new BusinessException('Credenciais inválidas');


            if (!$usuario->google2fa_enable)
                throw new BusinessException('2FA não está ativo.');

            $valido = $this->autenticacaoDoisFatoresService->verificar(
                $usuario->google2fa_secret,
                $request->codigo
            );

            if (!$valido)
                throw new BusinessException('Código inválido.');

            Cache::forget("2fa_login:{$request->temp_token}");

            return $this->finalizarLogin($usuario, $request);

        } catch (BusinessException $e) {
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

        return response()->json([
            '2fa_enable' => $usuario->google2fa_enable,
            'token' => $token,
            'expires_in' => JWTAuth::factory()->getTTL() * 60,
        ]);
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
                'ativo' => $user->ativo,
                'google2fa_enable' => $user->google2fa_enable,
                'google2fa_confirmado_em' => $user->google2fa_confirmado_em,
                'ultimo_login_em' => $user->ultimo_login_em,
                'ultimo_ip' => $user->ultimo_ip,
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
}
