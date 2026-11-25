<?php

/**
 * Login social (Google) nas duas áreas (Admin e Private).
 *
 * Regra central: NUNCA cria usuário. Só autentica quem já está cadastrado e ativo, na área
 * correta. O Google é simulado com Http::fake (sem rede real).
 *
 * Helpers com prefixo `social26`: as funções do Pest são globais.
 */

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

use PragmaRX\Google2FA\Google2FA;

use App\Models\Usuario;
use App\Models\Grupo;
use App\Models\GrupoEmpresa;
use App\Models\EntidadeTipo as EntidadeTipoModel;
use App\Models\UsuarioIdentidadeSocial;

use App\Enums\EntidadeTipo;

uses(RefreshDatabase::class);

const SOCIAL26_BINDING = 'binding-aleatorio-do-navegador-0123456789abcdef';

function social26Configurar(bool $ativo = true): void
{
    config([
        'api.autenticacao_social.provedores.google.ativo' => $ativo,
        'services.google.client_id' => 'client-id-teste',
        'services.google.client_secret' => 'client-secret-teste',
        'app.url_frontend' => 'http://localhost:3000',
    ]);
}

function social26Cenario(string $entidade): array
{
    $tipo = EntidadeTipoModel::create([
        'chave' => $entidade,
        'entidade_tabela' => $entidade === EntidadeTipo::PRIVATE->value ? 'grupo_empresas' : null,
    ]);

    $entidadeId = null;

    if ($entidade === EntidadeTipo::PRIVATE->value) {
        $entidadeId = GrupoEmpresa::create(['nome' => 'Empresa Social'])->id;
    }

    return [
        'grupo' => Grupo::create([
            'descricao' => 'Grupo ' . $entidade,
            'entidade_tipo_id' => $tipo->id,
            'entidade_id' => $entidadeId,
        ]),
        'base' => $entidade === EntidadeTipo::ADMIN->value ? '/api/admin' : '/api',
    ];
}

function social26Usuario(Grupo $grupo, string $email, string $status = 'ativo'): Usuario
{
    return Usuario::create([
        'grupo_id' => $grupo->id,
        'nome' => 'Usuário ' . $email,
        'email' => $email,
        'senha' => bcrypt('Senha123@'),
        'status' => $status,
    ]);
}

function social26FakeGoogle(string $sub, string $email, bool|string $verificado = true): void
{
    // Reinicia o factory: um segundo Http::fake com o mesmo padrão NÃO sobrescreve o primeiro.
    Http::swap(new \Illuminate\Http\Client\Factory());

    Http::fake([
        'oauth2.googleapis.com/*' => Http::response(['access_token' => 'access-token-google']),
        'openidconnect.googleapis.com/*' => Http::response([
            'sub' => $sub,
            'email' => $email,
            'email_verified' => $verificado,
            'name' => 'Nome Google',
        ]),
    ]);
}

/** Executa /iniciar e devolve o `state` embutido na URL do Google. */
function social26Iniciar($teste, string $base, string $binding = SOCIAL26_BINDING): string
{
    $url = $teste->postJson("{$base}/login/social/google/iniciar", ['binding' => $binding])
        ->assertOk()
        ->json('data.url');

    parse_str((string) parse_url($url, PHP_URL_QUERY), $query);

    return $query['state'];
}

function social26Callback($teste, string $base, string $state, string $binding = SOCIAL26_BINDING)
{
    return $teste->postJson("{$base}/login/social/google/callback", [
        'codigo' => 'codigo-de-autorizacao',
        'state' => $state,
        'binding' => $binding,
    ]);
}

foreach ([EntidadeTipo::ADMIN->value, EntidadeTipo::PRIVATE->value] as $entidade) {

    test("[{$entidade}] lista o Google só quando ativo e com credenciais", function () use ($entidade) {
        $c = social26Cenario($entidade);

        social26Configurar(ativo: false);
        $this->getJson("{$c['base']}/login/social/provedores")
            ->assertOk()
            ->assertJsonPath('data.provedores', []);

        social26Configurar();
        $this->getJson("{$c['base']}/login/social/provedores")
            ->assertOk()
            ->assertJsonPath('data.provedores.0.chave', 'google')
            ->assertJsonPath('data.provedores.0.nome', 'Google');

        config(['services.google.client_secret' => null]);
        $this->getJson("{$c['base']}/login/social/provedores")
            ->assertJsonPath('data.provedores', []);
    });

    test("[{$entidade}] iniciar devolve a URL do Google com state, PKCE e retorno no frontend", function () use ($entidade) {
        $c = social26Cenario($entidade);
        social26Configurar();

        $url = $this->postJson("{$c['base']}/login/social/google/iniciar", ['binding' => SOCIAL26_BINDING])
            ->assertOk()
            ->json('data.url');

        expect($url)->toStartWith('https://accounts.google.com/o/oauth2/v2/auth?');

        parse_str((string) parse_url($url, PHP_URL_QUERY), $q);

        expect($q['client_id'])->toBe('client-id-teste');
        expect($q['redirect_uri'])->toBe("http://localhost:3000/api/auth/{$entidade}/social/google/callback");
        expect($q['code_challenge_method'])->toBe('S256');
        expect($q['code_challenge'])->not->toBeEmpty();
        expect(strlen($q['state']))->toBeGreaterThanOrEqual(32);
        expect($url)->not->toContain('client-secret-teste');
    });

    test("[{$entidade}] iniciar exige binding e provedor disponível", function () use ($entidade) {
        $c = social26Cenario($entidade);
        social26Configurar();

        $this->postJson("{$c['base']}/login/social/google/iniciar", [])->assertStatus(422);
        $this->postJson("{$c['base']}/login/social/google/iniciar", ['binding' => 'curto'])->assertStatus(422);
        $this->postJson("{$c['base']}/login/social/inexistente/iniciar", ['binding' => SOCIAL26_BINDING])->assertStatus(404);

        social26Configurar(ativo: false);
        $this->postJson("{$c['base']}/login/social/google/iniciar", ['binding' => SOCIAL26_BINDING])->assertStatus(404);
    });

    test("[{$entidade}] usuário cadastrado e ativo entra, o vínculo é criado e o token autentica", function () use ($entidade) {
        $c = social26Cenario($entidade);
        social26Configurar();
        $usuario = social26Usuario($c['grupo'], "pessoa.{$entidade}@exemplo.com");

        social26FakeGoogle('sub-123', "Pessoa.{$entidade}@Exemplo.com");

        $state = social26Iniciar($this, $c['base']);
        $resposta = social26Callback($this, $c['base'], $state)->assertOk();

        expect($resposta->json('data.2fa_enable'))->toBeFalse();
        expect($resposta->json('data.token'))->not->toBeEmpty();

        $vinculo = UsuarioIdentidadeSocial::where('provedor', 'google')->where('provedor_usuario_id', 'sub-123')->first();
        expect($vinculo)->not->toBeNull();
        expect($vinculo->usuario_id)->toBe($usuario->id);

        $this->withHeader('Authorization', 'Bearer ' . $resposta->json('data.token'))
            ->getJson("{$c['base']}/me")
            ->assertOk()
            ->assertJsonPath('data.email', $usuario->email);
    });

    test("[{$entidade}] NUNCA cria usuário: e-mail não cadastrado é recusado", function () use ($entidade) {
        $c = social26Cenario($entidade);
        social26Configurar();
        social26Usuario($c['grupo'], "existente.{$entidade}@exemplo.com");

        social26FakeGoogle('sub-estranho', "estranho.{$entidade}@exemplo.com");

        $antes = Usuario::count();

        social26Callback($this, $c['base'], social26Iniciar($this, $c['base']))
            ->assertStatus(401)
            ->assertJsonStructure(['errors' => ['business']]);

        expect(Usuario::count())->toBe($antes);
        expect(UsuarioIdentidadeSocial::count())->toBe(0);
    });

    test("[{$entidade}] e-mail não verificado pelo provedor é recusado", function () use ($entidade) {
        $c = social26Cenario($entidade);
        social26Configurar();
        social26Usuario($c['grupo'], "pessoa.{$entidade}@exemplo.com");

        social26FakeGoogle('sub-1', "pessoa.{$entidade}@exemplo.com", verificado: false);

        social26Callback($this, $c['base'], social26Iniciar($this, $c['base']))->assertStatus(401);

        expect(UsuarioIdentidadeSocial::count())->toBe(0);
    });

    test("[{$entidade}] aceita email_verified como string \"true\" e recusa \"false\"", function () use ($entidade) {
        $c = social26Cenario($entidade);
        social26Configurar();
        social26Usuario($c['grupo'], "pessoa.{$entidade}@exemplo.com");

        social26FakeGoogle('sub-1', "pessoa.{$entidade}@exemplo.com", verificado: 'false');
        social26Callback($this, $c['base'], social26Iniciar($this, $c['base']))->assertStatus(401);

        social26FakeGoogle('sub-1', "pessoa.{$entidade}@exemplo.com", verificado: 'true');
        social26Callback($this, $c['base'], social26Iniciar($this, $c['base']))->assertOk();
    });

    test("[{$entidade}] usuário convidado, inativo ou bloqueado é recusado", function () use ($entidade) {
        $c = social26Cenario($entidade);
        social26Configurar();

        foreach (['convidado', 'inativo', 'bloqueado', 'expirado'] as $status) {
            social26Usuario($c['grupo'], "{$status}.{$entidade}@exemplo.com", $status);

            social26FakeGoogle("sub-{$status}", "{$status}.{$entidade}@exemplo.com");

            social26Callback($this, $c['base'], social26Iniciar($this, $c['base']))->assertStatus(401);
        }

        expect(UsuarioIdentidadeSocial::count())->toBe(0);
    });

    test("[{$entidade}] usuário que perde o acesso depois do vínculo deixa de entrar", function () use ($entidade) {
        $c = social26Cenario($entidade);
        social26Configurar();
        $usuario = social26Usuario($c['grupo'], "pessoa.{$entidade}@exemplo.com");

        social26FakeGoogle('sub-1', $usuario->email);
        social26Callback($this, $c['base'], social26Iniciar($this, $c['base']))->assertOk();

        $usuario->forceFill(['status' => 'inativo'])->save();

        social26Callback($this, $c['base'], social26Iniciar($this, $c['base']))->assertStatus(401);
    });

    test("[{$entidade}] depois do vínculo, vale o `sub` e não o e-mail", function () use ($entidade) {
        $c = social26Cenario($entidade);
        social26Configurar();
        $dono = social26Usuario($c['grupo'], "dono.{$entidade}@exemplo.com");
        social26Usuario($c['grupo'], "outro.{$entidade}@exemplo.com");

        social26FakeGoogle('sub-do-dono', $dono->email);
        social26Callback($this, $c['base'], social26Iniciar($this, $c['base']))->assertOk();

        // A conta Google do dono passa a usar o e-mail de OUTRO usuário cadastrado: continua sendo o dono.
        social26FakeGoogle('sub-do-dono', "outro.{$entidade}@exemplo.com");
        $token = social26Callback($this, $c['base'], social26Iniciar($this, $c['base']))->assertOk()->json('data.token');

        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson("{$c['base']}/me")
            ->assertJsonPath('data.email', $dono->email);
    });

    test("[{$entidade}] outra conta Google com o e-mail de um usuário já vinculado é recusada", function () use ($entidade) {
        $c = social26Cenario($entidade);
        social26Configurar();
        $usuario = social26Usuario($c['grupo'], "pessoa.{$entidade}@exemplo.com");

        social26FakeGoogle('sub-original', $usuario->email);
        social26Callback($this, $c['base'], social26Iniciar($this, $c['base']))->assertOk();

        social26FakeGoogle('sub-intruso', $usuario->email);
        social26Callback($this, $c['base'], social26Iniciar($this, $c['base']))->assertStatus(401);

        expect(UsuarioIdentidadeSocial::count())->toBe(1);
    });

    test("[{$entidade}] 2FA habilitado: login social exige o código e conclui em /2fa/verificar", function () use ($entidade) {
        $c = social26Cenario($entidade);
        social26Configurar();

        $google2fa = new Google2FA();
        $segredo = $google2fa->generateSecretKey();

        $usuario = social26Usuario($c['grupo'], "pessoa.{$entidade}@exemplo.com");
        $usuario->forceFill([
            'google2fa_enable' => true,
            'google2fa_secret' => $segredo,
            'google2fa_confirmado_em' => now(),
        ])->save();

        social26FakeGoogle('sub-2fa', $usuario->email);

        $resposta = social26Callback($this, $c['base'], social26Iniciar($this, $c['base']))->assertOk();

        expect($resposta->json('data.2fa_enable'))->toBeTrue();
        expect($resposta->json('data.token'))->toBeNull();
        $tempToken = $resposta->json('data.temp_token');
        expect($tempToken)->not->toBeEmpty();

        $final = $this->postJson("{$c['base']}/2fa/verificar", [
            'temp_token' => $tempToken,
            'codigo' => $google2fa->getCurrentOtp($segredo),
        ])->assertOk();

        expect($final->json('data.token'))->not->toBeEmpty();
    });

    test("[{$entidade}] binding diferente do que iniciou o fluxo é recusado (login CSRF)", function () use ($entidade) {
        $c = social26Cenario($entidade);
        social26Configurar();
        social26Usuario($c['grupo'], "pessoa.{$entidade}@exemplo.com");
        social26FakeGoogle('sub-1', "pessoa.{$entidade}@exemplo.com");

        $state = social26Iniciar($this, $c['base']);

        social26Callback($this, $c['base'], $state, binding: str_repeat('x', 40))->assertStatus(422);

        // O state foi consumido pela tentativa inválida: nem o navegador legítimo o reaproveita.
        social26Callback($this, $c['base'], $state)->assertStatus(422);

        Http::assertNothingSent();
    });

    test("[{$entidade}] state é de uso único e state desconhecido é recusado", function () use ($entidade) {
        $c = social26Cenario($entidade);
        social26Configurar();
        social26Usuario($c['grupo'], "pessoa.{$entidade}@exemplo.com");
        social26FakeGoogle('sub-1', "pessoa.{$entidade}@exemplo.com");

        $state = social26Iniciar($this, $c['base']);

        social26Callback($this, $c['base'], $state)->assertOk();
        social26Callback($this, $c['base'], $state)->assertStatus(422);
        social26Callback($this, $c['base'], 'state-que-nunca-existiu')->assertStatus(422);
    });

    test("[{$entidade}] state iniciado em uma área não vale na outra", function () use ($entidade) {
        $c = social26Cenario($entidade);
        social26Configurar();

        $outraBase = $entidade === EntidadeTipo::ADMIN->value ? '/api' : '/api/admin';

        $state = social26Iniciar($this, $c['base']);

        social26Callback($this, $outraBase, $state)->assertStatus(422);
    });

    test("[{$entidade}] falha do Google na troca do code é recusada sem expor detalhes", function () use ($entidade) {
        $c = social26Cenario($entidade);
        social26Configurar();

        Http::swap(new \Illuminate\Http\Client\Factory());
    Http::fake(['oauth2.googleapis.com/*' => Http::response(['error' => 'invalid_grant'], 400)]);

        $resposta = social26Callback($this, $c['base'], social26Iniciar($this, $c['base']))->assertStatus(422);

        expect($resposta->getContent())->not->toContain('invalid_grant');
    });

    test("[{$entidade}] excesso de falhas por IP bloqueia novas tentativas (429)", function () use ($entidade) {
        $c = social26Cenario($entidade);
        social26Configurar();

        for ($i = 0; $i < 30; $i++) {
            social26Callback($this, $c['base'], 'state-invalido-' . $i)->assertStatus(422);
        }

        social26Callback($this, $c['base'], 'state-invalido-final')->assertStatus(429);
    });
}

test('um usuário Admin não entra pela área Private (e vice-versa)', function () {
    $admin = social26Cenario(EntidadeTipo::ADMIN->value);
    $private = social26Cenario(EntidadeTipo::PRIVATE->value);
    social26Configurar();

    social26Usuario($admin['grupo'], 'admin@exemplo.com');
    social26Usuario($private['grupo'], 'cliente@exemplo.com');

    social26FakeGoogle('sub-admin', 'admin@exemplo.com');
    social26Callback($this, $private['base'], social26Iniciar($this, $private['base']))->assertStatus(401);

    social26FakeGoogle('sub-cliente', 'cliente@exemplo.com');
    social26Callback($this, $admin['base'], social26Iniciar($this, $admin['base']))->assertStatus(401);

    expect(UsuarioIdentidadeSocial::count())->toBe(0);
});

/*
|--------------------------------------------------------------------------
| Perfil → aba "Login social": vincular e desvincular (Admin e Private)
|--------------------------------------------------------------------------
*/

/** Login por senha (helper de cenário: todos os usuários usam Senha123@). */
function social26Token($teste, string $base, string $email): string
{
    return $teste->postJson("{$base}/login", ['email' => $email, 'senha' => 'Senha123@'])
        ->assertOk()
        ->json('data.token');
}

function social26Autenticado($teste, string $token)
{
    return $teste->withHeader('Authorization', 'Bearer ' . $token);
}

/** /vincular/iniciar → devolve o state da URL do provedor. */
function social26VincularIniciar($teste, string $base, string $token, string $senha = 'Senha123@', string $binding = SOCIAL26_BINDING): string
{
    $url = social26Autenticado($teste, $token)
        ->postJson("{$base}/perfil/login-social/google/vincular/iniciar", ['senha' => $senha, 'binding' => $binding])
        ->assertOk()
        ->json('data.url');

    parse_str((string) parse_url($url, PHP_URL_QUERY), $query);

    return $query['state'];
}

function social26VincularCallback($teste, string $base, string $token, string $state, string $binding = SOCIAL26_BINDING)
{
    return social26Autenticado($teste, $token)->postJson("{$base}/perfil/login-social/google/vincular/callback", [
        'codigo' => 'codigo-de-autorizacao',
        'state' => $state,
        'binding' => $binding,
    ]);
}

foreach ([EntidadeTipo::ADMIN->value, EntidadeTipo::PRIVATE->value] as $entidade) {

    test("[{$entidade}] perfil: exige autenticação", function () use ($entidade) {
        $c = social26Cenario($entidade);
        social26Configurar();

        $this->getJson("{$c['base']}/perfil/login-social")->assertStatus(401);
        $this->postJson("{$c['base']}/perfil/login-social/google/vincular/iniciar", ['senha' => 'x', 'binding' => SOCIAL26_BINDING])->assertStatus(401);
        $this->postJson("{$c['base']}/perfil/login-social/google/vincular/callback", [])->assertStatus(401);
        $this->deleteJson("{$c['base']}/perfil/login-social/google")->assertStatus(401);
    });

    test("[{$entidade}] perfil: lista o Google como não vinculado e depois vinculado", function () use ($entidade) {
        $c = social26Cenario($entidade);
        social26Configurar();
        $usuario = social26Usuario($c['grupo'], "pessoa.{$entidade}@exemplo.com");
        $token = social26Token($this, $c['base'], $usuario->email);

        social26Autenticado($this, $token)->getJson("{$c['base']}/perfil/login-social")
            ->assertOk()
            ->assertJsonPath('data.0.chave', 'google')
            ->assertJsonPath('data.0.nome', 'Google')
            ->assertJsonPath('data.0.disponivel', true)
            ->assertJsonPath('data.0.vinculado', false)
            ->assertJsonPath('data.0.email', null);

        social26FakeGoogle('sub-1', 'outro.email@gmail.com');
        social26VincularCallback($this, $c['base'], $token, social26VincularIniciar($this, $c['base'], $token))
            ->assertOk()
            ->assertJsonPath('data.vinculado', true)
            ->assertJsonPath('data.email', 'outro.email@gmail.com');

        social26Autenticado($this, $token)->getJson("{$c['base']}/perfil/login-social")
            ->assertJsonPath('data.0.vinculado', true);
    });

    test("[{$entidade}] perfil: vincular exige a senha atual e limita tentativas", function () use ($entidade) {
        $c = social26Cenario($entidade);
        social26Configurar();
        $usuario = social26Usuario($c['grupo'], "pessoa.{$entidade}@exemplo.com");
        $token = social26Token($this, $c['base'], $usuario->email);
        $url = "{$c['base']}/perfil/login-social/google/vincular/iniciar";

        social26Autenticado($this, $token)->postJson($url, ['binding' => SOCIAL26_BINDING])->assertStatus(422);

        for ($i = 0; $i < 5; $i++) {
            social26Autenticado($this, $token)
                ->postJson($url, ['senha' => 'SenhaErrada@1', 'binding' => SOCIAL26_BINDING])
                ->assertStatus(422)
                ->assertJsonPath('errors.business.0', 'A senha está incorreta.');
        }

        // Bloqueado: nem a senha CERTA passa até o limite expirar.
        social26Autenticado($this, $token)
            ->postJson($url, ['senha' => 'Senha123@', 'binding' => SOCIAL26_BINDING])
            ->assertStatus(429);
    });

    test("[{$entidade}] perfil: vincular com provedor inexistente ou desativado é 404", function () use ($entidade) {
        $c = social26Cenario($entidade);
        social26Configurar();
        $usuario = social26Usuario($c['grupo'], "pessoa.{$entidade}@exemplo.com");
        $token = social26Token($this, $c['base'], $usuario->email);
        $corpo = ['senha' => 'Senha123@', 'binding' => SOCIAL26_BINDING];

        social26Autenticado($this, $token)
            ->postJson("{$c['base']}/perfil/login-social/inexistente/vincular/iniciar", $corpo)->assertStatus(404);

        social26Configurar(ativo: false);

        social26Autenticado($this, $token)
            ->postJson("{$c['base']}/perfil/login-social/google/vincular/iniciar", $corpo)->assertStatus(404);
    });

    test("[{$entidade}] perfil: conta vinculada com OUTRO e-mail entra pelo login social", function () use ($entidade) {
        $c = social26Cenario($entidade);
        social26Configurar();
        $usuario = social26Usuario($c['grupo'], "pessoa.{$entidade}@exemplo.com");
        $token = social26Token($this, $c['base'], $usuario->email);

        social26FakeGoogle('sub-pessoal', 'pessoal.diferente@gmail.com');
        social26VincularCallback($this, $c['base'], $token, social26VincularIniciar($this, $c['base'], $token))->assertOk();

        $login = social26Callback($this, $c['base'], social26Iniciar($this, $c['base']))->assertOk();

        social26Autenticado($this, $login->json('data.token'))->getJson("{$c['base']}/me")
            ->assertJsonPath('data.email', $usuario->email);
    });

    test("[{$entidade}] perfil: já vinculado, não aceita iniciar outro vínculo do mesmo provedor", function () use ($entidade) {
        $c = social26Cenario($entidade);
        social26Configurar();
        $usuario = social26Usuario($c['grupo'], "pessoa.{$entidade}@exemplo.com");
        $token = social26Token($this, $c['base'], $usuario->email);

        social26FakeGoogle('sub-1', 'a@gmail.com');
        social26VincularCallback($this, $c['base'], $token, social26VincularIniciar($this, $c['base'], $token))->assertOk();

        social26Autenticado($this, $token)
            ->postJson("{$c['base']}/perfil/login-social/google/vincular/iniciar", ['senha' => 'Senha123@', 'binding' => SOCIAL26_BINDING])
            ->assertStatus(422);
    });

    test("[{$entidade}] perfil: conta já vinculada a OUTRO usuário é recusada", function () use ($entidade) {
        $c = social26Cenario($entidade);
        social26Configurar();
        $a = social26Usuario($c['grupo'], "a.{$entidade}@exemplo.com");
        $b = social26Usuario($c['grupo'], "b.{$entidade}@exemplo.com");

        social26FakeGoogle('sub-compartilhado', 'a@gmail.com');

        $tokenA = social26Token($this, $c['base'], $a->email);
        social26VincularCallback($this, $c['base'], $tokenA, social26VincularIniciar($this, $c['base'], $tokenA))->assertOk();

        $tokenB = social26Token($this, $c['base'], $b->email);
        social26VincularCallback($this, $c['base'], $tokenB, social26VincularIniciar($this, $c['base'], $tokenB))
            ->assertStatus(422)
            ->assertJsonPath('errors.business.0', 'Esta conta Google já está vinculada a outro usuário.');

        expect(UsuarioIdentidadeSocial::where('usuario_id', $b->id)->count())->toBe(0);
    });

    test("[{$entidade}] perfil: e-mail não verificado no provedor é recusado", function () use ($entidade) {
        $c = social26Cenario($entidade);
        social26Configurar();
        $usuario = social26Usuario($c['grupo'], "pessoa.{$entidade}@exemplo.com");
        $token = social26Token($this, $c['base'], $usuario->email);

        social26FakeGoogle('sub-1', 'a@gmail.com', verificado: false);

        social26VincularCallback($this, $c['base'], $token, social26VincularIniciar($this, $c['base'], $token))->assertStatus(422);

        expect(UsuarioIdentidadeSocial::count())->toBe(0);
    });

    test("[{$entidade}] perfil: state de login não serve para vincular, nem o de vínculo para login", function () use ($entidade) {
        $c = social26Cenario($entidade);
        social26Configurar();
        $usuario = social26Usuario($c['grupo'], "pessoa.{$entidade}@exemplo.com");
        $token = social26Token($this, $c['base'], $usuario->email);

        social26FakeGoogle('sub-1', $usuario->email);

        // state de LOGIN usado no callback de VÍNCULO
        social26VincularCallback($this, $c['base'], $token, social26Iniciar($this, $c['base']))->assertStatus(422);

        // state de VÍNCULO usado no callback de LOGIN
        social26Callback($this, $c['base'], social26VincularIniciar($this, $c['base'], $token))->assertStatus(422);

        expect(UsuarioIdentidadeSocial::count())->toBe(0);
    });

    test("[{$entidade}] perfil: o state de vínculo é do usuário que o iniciou", function () use ($entidade) {
        $c = social26Cenario($entidade);
        social26Configurar();
        $a = social26Usuario($c['grupo'], "a.{$entidade}@exemplo.com");
        $b = social26Usuario($c['grupo'], "b.{$entidade}@exemplo.com");
        $tokenA = social26Token($this, $c['base'], $a->email);
        $tokenB = social26Token($this, $c['base'], $b->email);

        social26FakeGoogle('sub-1', 'a@gmail.com');

        $stateDeA = social26VincularIniciar($this, $c['base'], $tokenA);

        social26VincularCallback($this, $c['base'], $tokenB, $stateDeA)->assertStatus(422);

        expect(UsuarioIdentidadeSocial::count())->toBe(0);
    });

    test("[{$entidade}] perfil: binding diferente e state repetido são recusados", function () use ($entidade) {
        $c = social26Cenario($entidade);
        social26Configurar();
        $usuario = social26Usuario($c['grupo'], "pessoa.{$entidade}@exemplo.com");
        $token = social26Token($this, $c['base'], $usuario->email);

        social26FakeGoogle('sub-1', 'a@gmail.com');

        $state = social26VincularIniciar($this, $c['base'], $token);
        social26VincularCallback($this, $c['base'], $token, $state, binding: str_repeat('x', 40))->assertStatus(422);
        social26VincularCallback($this, $c['base'], $token, $state)->assertStatus(422); // consumido

        $state = social26VincularIniciar($this, $c['base'], $token);
        social26VincularCallback($this, $c['base'], $token, $state)->assertOk();
        social26VincularCallback($this, $c['base'], $token, $state)->assertStatus(422);
    });

    test("[{$entidade}] perfil: desvincular remove o vínculo, o login social deixa de funcionar e a senha continua", function () use ($entidade) {
        $c = social26Cenario($entidade);
        social26Configurar();
        $usuario = social26Usuario($c['grupo'], "pessoa.{$entidade}@exemplo.com");
        $token = social26Token($this, $c['base'], $usuario->email);

        social26FakeGoogle('sub-1', $usuario->email);
        social26VincularCallback($this, $c['base'], $token, social26VincularIniciar($this, $c['base'], $token))->assertOk();

        social26Autenticado($this, $token)->deleteJson("{$c['base']}/perfil/login-social/google")->assertNoContent();

        expect(UsuarioIdentidadeSocial::count())->toBe(0);

        // Sem vínculo, uma conta Google de e-mail NÃO cadastrado não entra.
        social26FakeGoogle('sub-2', 'qualquer.outro@gmail.com');
        social26Callback($this, $c['base'], social26Iniciar($this, $c['base']))->assertStatus(401);

        // Login por senha segue funcionando.
        social26Token($this, $c['base'], $usuario->email);

        // E dá para vincular de novo.
        social26FakeGoogle('sub-3', 'novo@gmail.com');
        social26VincularCallback($this, $c['base'], $token, social26VincularIniciar($this, $c['base'], $token))->assertOk();
    });

    test("[{$entidade}] perfil: desvincular sem vínculo é 404 e só atinge o próprio usuário", function () use ($entidade) {
        $c = social26Cenario($entidade);
        social26Configurar();
        $a = social26Usuario($c['grupo'], "a.{$entidade}@exemplo.com");
        $b = social26Usuario($c['grupo'], "b.{$entidade}@exemplo.com");

        social26FakeGoogle('sub-a', 'a@gmail.com');
        $tokenA = social26Token($this, $c['base'], $a->email);
        social26VincularCallback($this, $c['base'], $tokenA, social26VincularIniciar($this, $c['base'], $tokenA))->assertOk();

        $tokenB = social26Token($this, $c['base'], $b->email);
        social26Autenticado($this, $tokenB)->deleteJson("{$c['base']}/perfil/login-social/google")->assertStatus(404);

        expect(UsuarioIdentidadeSocial::where('usuario_id', $a->id)->count())->toBe(1);
    });

    test("[{$entidade}] perfil: provedor desativado depois do vínculo aparece como indisponível e ainda pode ser removido", function () use ($entidade) {
        $c = social26Cenario($entidade);
        social26Configurar();
        $usuario = social26Usuario($c['grupo'], "pessoa.{$entidade}@exemplo.com");
        $token = social26Token($this, $c['base'], $usuario->email);

        social26FakeGoogle('sub-1', 'a@gmail.com');
        social26VincularCallback($this, $c['base'], $token, social26VincularIniciar($this, $c['base'], $token))->assertOk();

        social26Configurar(ativo: false);

        social26Autenticado($this, $token)->getJson("{$c['base']}/perfil/login-social")
            ->assertOk()
            ->assertJsonPath('data.0.chave', 'google')
            ->assertJsonPath('data.0.disponivel', false)
            ->assertJsonPath('data.0.vinculado', true);

        social26Autenticado($this, $token)->deleteJson("{$c['base']}/perfil/login-social/google")->assertNoContent();
    });
}

test('perfil: um usuário Admin não acessa o login social do perfil Private (e vice-versa)', function () {
    $admin = social26Cenario(EntidadeTipo::ADMIN->value);
    $private = social26Cenario(EntidadeTipo::PRIVATE->value);
    social26Configurar();

    social26Usuario($admin['grupo'], 'admin@exemplo.com');
    social26Usuario($private['grupo'], 'cliente@exemplo.com');

    $tokenAdmin = social26Token($this, $admin['base'], 'admin@exemplo.com');
    $tokenPrivate = social26Token($this, $private['base'], 'cliente@exemplo.com');

    social26Autenticado($this, $tokenAdmin)->getJson("{$private['base']}/perfil/login-social")->assertStatus(403);
    social26Autenticado($this, $tokenPrivate)->getJson("{$admin['base']}/perfil/login-social")->assertStatus(403);
});

test('login (e-mail e senha) e 2FA seguem emitindo o mesmo JWT após a unificação no LoginService', function () {
    $c = social26Cenario(EntidadeTipo::ADMIN->value);
    $usuario = social26Usuario($c['grupo'], 'pessoa@exemplo.com');

    $resposta = $this->postJson("{$c['base']}/login", ['email' => $usuario->email, 'senha' => 'Senha123@'])->assertOk();

    expect($resposta->json('data.2fa_enable'))->toBeFalse();
    expect($resposta->json('data.token'))->not->toBeEmpty();
    expect($resposta->json('data.expires_in'))->toBeInt()->toBeGreaterThan(0);
});
