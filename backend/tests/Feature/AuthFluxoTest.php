<?php

/**
 * Cobertura do fluxo de autenticação (Admin e Private) que hoje não possui
 * nenhum teste automatizado: login + 2FA, primeiro acesso, esqueceu/redefinir
 * senha, refresh, logout e /me.
 *
 * Cada teste é executado para as duas audiências (admin e private) a partir
 * dos mesmos helpers, já que Admin\AuthController e Private\AuthController
 * implementam exatamente a mesma regra de negócio (apenas o prefixo de rota
 * e o EntidadeTipo mudam).
 *
 * Os e-mails de "esqueceu a senha" / "senha alterada" dependem de um
 * provedor HTTP externo (App\Services\External\Email\AmazonSesService).
 * Para não depender de rede real, os eventos que disparam esses e-mails são
 * sempre testados com Event::fake(), assim como já é feito em
 * tests/Feature/SegurancaTest.php.
 */

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;

use PragmaRX\Google2FA\Google2FA;
use Tymon\JWTAuth\Facades\JWTAuth;

use App\Models\Usuario;
use App\Models\Grupo;
use App\Models\GrupoEmpresa;
use App\Models\EntidadeTipo as EntidadeTipoModel;
use App\Models\UsuarioSessao;
use App\Models\TokenResetSenha;

use App\Services\TokenResetSenhaService;

use App\Events\UsuarioEsqueceuSenha;
use App\Events\SenhaUsuarioAlterada;

use App\Enums\UsuarioStatus;
use App\Enums\EntidadeTipo;

uses(RefreshDatabase::class);

/**
 * Monta o Grupo/EntidadeTipo necessário para autenticar na audiência informada.
 * Para "private" também cria o GrupoEmpresa vinculado, pois
 * UsuarioService::obterUsuarioAtivoPorEmail() exige que o grupo de um
 * usuário private esteja de fato ligado a um grupo_empresa existente.
 */
function cenarioAuthFluxo(string $entidade): array
{
    $tipo = EntidadeTipoModel::create([
        'chave' => $entidade,
        'entidade_tabela' => $entidade === EntidadeTipo::PRIVATE->value ? 'grupo_empresas' : null,
    ]);

    $grupoEmpresa = null;
    $entidadeId = null;

    if ($entidade === EntidadeTipo::PRIVATE->value) {
        $grupoEmpresa = GrupoEmpresa::create(['nome' => 'Empresa Auth Fluxo']);
        $entidadeId = $grupoEmpresa->id;
    }

    $grupo = Grupo::create([
        'descricao' => 'Grupo ' . $entidade,
        'entidade_tipo_id' => $tipo->id,
        'entidade_id' => $entidadeId,
    ]);

    return [
        'tipo' => $tipo,
        'grupo' => $grupo,
        'grupoEmpresa' => $grupoEmpresa,
        'base' => $entidade === EntidadeTipo::ADMIN->value ? '/api/admin' : '/api',
    ];
}

function criarUsuarioAuthFluxo(Grupo $grupo, string $email, string $status = 'ativo', array $extra = []): Usuario
{
    return Usuario::create(array_merge([
        'grupo_id' => $grupo->id,
        'nome' => 'Usuário ' . $email,
        'email' => $email,
        'senha' => bcrypt('Senha123@'),
        'status' => $status,
    ], $extra));
}

function autenticarAuthFluxo(Usuario $usuario): string
{
    $sessao = UsuarioSessao::create([
        'usuario_id' => $usuario->id,
        'ativo' => true,
        'ultimo_acesso_em' => now(),
    ]);

    return JWTAuth::claims(['session_id' => $sessao->id])->fromUser($usuario);
}

foreach ([EntidadeTipo::ADMIN->value, EntidadeTipo::PRIVATE->value] as $entidade) {

    // -----------------------------------------------------------------------------------
    // Login + 2FA (fluxo completo até o token final)
    // -----------------------------------------------------------------------------------

    test("[{$entidade}] login com 2FA habilitado exige verificar2fa e só então retorna o token final", function () use ($entidade) {
        $c = cenarioAuthFluxo($entidade);

        $google2fa = new Google2FA();
        $segredo = $google2fa->generateSecretKey();

        $usuario = criarUsuarioAuthFluxo($c['grupo'], "usuario.2fa.{$entidade}@exemplo.com");
        $usuario->forceFill([
            'google2fa_enable' => true,
            'google2fa_secret' => $segredo,
            'google2fa_confirmado_em' => now(),
        ])->save();

        $login = $this->postJson("{$c['base']}/login", [
            'email' => $usuario->email,
            'senha' => 'Senha123@',
        ])->assertOk();

        expect($login->json('data.2fa_enable'))->toBeTrue();
        $tempToken = $login->json('data.temp_token');
        expect($tempToken)->not->toBeEmpty();
        expect($login->json('data.token'))->toBeNull();

        $confirmacao = $this->postJson("{$c['base']}/2fa/verificar", [
            'temp_token' => $tempToken,
            'codigo' => $google2fa->getCurrentOtp($segredo),
        ])->assertOk();

        expect($confirmacao->json('data.token'))->not->toBeEmpty();
        expect($confirmacao->json('data.expires_in'))->toBeGreaterThan(0);

        // O token final realmente autentica no /me da mesma audiência.
        $this->withHeader('Authorization', 'Bearer ' . $confirmacao->json('data.token'))
            ->getJson("{$c['base']}/me")
            ->assertOk()
            ->assertJsonPath('data.email', $usuario->email);
    });

    test("[{$entidade}] login sem 2FA habilitado retorna o token diretamente", function () use ($entidade) {
        $c = cenarioAuthFluxo($entidade);
        $usuario = criarUsuarioAuthFluxo($c['grupo'], "usuario.simples.{$entidade}@exemplo.com");

        $login = $this->postJson("{$c['base']}/login", [
            'email' => $usuario->email,
            'senha' => 'Senha123@',
        ])->assertOk();

        expect($login->json('data.2fa_enable'))->toBeFalse();
        expect($login->json('data.token'))->not->toBeEmpty();

        expect($usuario->fresh()->ultimo_login_em)->not->toBeNull();
    });

    test("[{$entidade}] login falha com senha incorreta e não cria sessão", function () use ($entidade) {
        $c = cenarioAuthFluxo($entidade);
        $usuario = criarUsuarioAuthFluxo($c['grupo'], "usuario.senhaerrada.{$entidade}@exemplo.com");

        $this->postJson("{$c['base']}/login", [
            'email' => $usuario->email,
            'senha' => 'SenhaErrada@1',
        ])->assertStatus(401);

        expect(UsuarioSessao::where('usuario_id', $usuario->id)->count())->toBe(0);
    });

    test("[{$entidade}] login falha para usuário com status diferente de ativo", function () use ($entidade) {
        $c = cenarioAuthFluxo($entidade);
        $usuario = criarUsuarioAuthFluxo($c['grupo'], "usuario.inativo.{$entidade}@exemplo.com", UsuarioStatus::INATIVO->value);

        $this->postJson("{$c['base']}/login", [
            'email' => $usuario->email,
            'senha' => 'Senha123@',
        ])->assertStatus(401);
    });

    // -----------------------------------------------------------------------------------
    // Primeiro acesso
    // -----------------------------------------------------------------------------------

    test("[{$entidade}] primeiro acesso: fluxo completo ativa o usuário convidado e permite login com a nova senha", function () use ($entidade) {
        $c = cenarioAuthFluxo($entidade);
        $usuario = criarUsuarioAuthFluxo($c['grupo'], "convidado.{$entidade}@exemplo.com", UsuarioStatus::CONVIDADO->value);

        $token = app(TokenResetSenhaService::class)->gerarToken($usuario);

        $validar = $this->getJson("{$c['base']}/primeiro-acesso/validar?token={$token}")
            ->assertOk();

        expect($validar->json('data.email'))->toBe($usuario->email);

        $this->postJson("{$c['base']}/primeiro-acesso", [
            'token' => $token,
            'senha' => 'NovaSenha@456',
            'senha_confirma' => 'NovaSenha@456',
        ])->assertStatus(204);

        $usuario->refresh();
        expect($usuario->status)->toBe(UsuarioStatus::ATIVO->value);
        expect(\Illuminate\Support\Facades\Hash::check('NovaSenha@456', $usuario->senha))->toBeTrue();

        $this->postJson("{$c['base']}/login", [
            'email' => $usuario->email,
            'senha' => 'NovaSenha@456',
        ])->assertOk();
    });

    test("[{$entidade}] primeiro acesso: token inexistente é rejeitado como erro de negócio", function () use ($entidade) {
        $c = cenarioAuthFluxo($entidade);

        $this->getJson("{$c['base']}/primeiro-acesso/validar?token=token-inexistente")
            ->assertStatus(400)
            ->assertJsonPath('errors.business.0', 'Token inválido ou expirado.');

        $this->postJson("{$c['base']}/primeiro-acesso", [
            'token' => 'token-inexistente',
            'senha' => 'NovaSenha@456',
            'senha_confirma' => 'NovaSenha@456',
        ])->assertStatus(400);
    });

    test("[{$entidade}] primeiro acesso: exige token, senha forte e confirmação igual", function () use ($entidade) {
        $c = cenarioAuthFluxo($entidade);

        // Sem nenhum campo.
        $this->postJson("{$c['base']}/primeiro-acesso", [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['token', 'senha', 'senha_confirma']);

        $usuario = criarUsuarioAuthFluxo($c['grupo'], "convidado.fraca.{$entidade}@exemplo.com", UsuarioStatus::CONVIDADO->value);
        $token = app(TokenResetSenhaService::class)->gerarToken($usuario);

        // Senha sem os requisitos de complexidade.
        $this->postJson("{$c['base']}/primeiro-acesso", [
            'token' => $token,
            'senha' => '12345678',
            'senha_confirma' => '12345678',
        ])->assertStatus(422)->assertJsonValidationErrors(['senha']);

        // Confirmação não confere.
        $this->postJson("{$c['base']}/primeiro-acesso", [
            'token' => $token,
            'senha' => 'NovaSenha@456',
            'senha_confirma' => 'Diferente@456',
        ])->assertStatus(422)->assertJsonValidationErrors(['senha_confirma']);

        // O usuário continua convidado, pois nenhuma das tentativas foi válida.
        expect($usuario->fresh()->status)->toBe(UsuarioStatus::CONVIDADO->value);
    });

    test("[{$entidade}] primeiro acesso: o mesmo token não pode ser usado duas vezes", function () use ($entidade) {
        $c = cenarioAuthFluxo($entidade);
        $usuario = criarUsuarioAuthFluxo($c['grupo'], "convidado.reuso.{$entidade}@exemplo.com", UsuarioStatus::CONVIDADO->value);
        $token = app(TokenResetSenhaService::class)->gerarToken($usuario);

        $this->postJson("{$c['base']}/primeiro-acesso", [
            'token' => $token,
            'senha' => 'NovaSenha@456',
            'senha_confirma' => 'NovaSenha@456',
        ])->assertStatus(204);

        $this->postJson("{$c['base']}/primeiro-acesso", [
            'token' => $token,
            'senha' => 'OutraSenha@789',
            'senha_confirma' => 'OutraSenha@789',
        ])
            ->assertStatus(400)
            ->assertJsonPath('errors.business.0', 'Este link já foi utilizado.');
    });

    // -----------------------------------------------------------------------------------
    // Esqueceu a senha
    // -----------------------------------------------------------------------------------

    test("[{$entidade}] esqueceu-senha: resposta é idêntica para e-mail existente e inexistente, mas o e-mail só é disparado quando o usuário existe", function () use ($entidade) {
        Event::fake([UsuarioEsqueceuSenha::class]);

        $c = cenarioAuthFluxo($entidade);
        $usuario = criarUsuarioAuthFluxo($c['grupo'], "esqueceu.{$entidade}@exemplo.com");

        $comCadastro = $this->postJson("{$c['base']}/esqueceu-senha", ['email' => $usuario->email])
            ->assertOk();

        Event::assertDispatched(UsuarioEsqueceuSenha::class, function ($event) use ($usuario) {
            return $event->usuario->is($usuario);
        });

        Event::fake([UsuarioEsqueceuSenha::class]);

        $semCadastro = $this->postJson("{$c['base']}/esqueceu-senha", ['email' => 'naoexiste.esqueceu@exemplo.com'])
            ->assertOk();

        Event::assertNotDispatched(UsuarioEsqueceuSenha::class);

        expect($comCadastro->json('data.mensagem'))->toBe($semCadastro->json('data.mensagem'));
        expect(TokenResetSenha::where('usuario_id', $usuario->id)->count())->toBe(1);
    });

    test("[{$entidade}] esqueceu-senha: usuário convidado (ainda sem senha ativa) também recebe o token, mas usuário inativo não", function () use ($entidade) {
        Event::fake([UsuarioEsqueceuSenha::class]);

        $c = cenarioAuthFluxo($entidade);
        $convidado = criarUsuarioAuthFluxo($c['grupo'], "esqueceu.convidado.{$entidade}@exemplo.com", UsuarioStatus::CONVIDADO->value);
        $inativo = criarUsuarioAuthFluxo($c['grupo'], "esqueceu.inativo.{$entidade}@exemplo.com", UsuarioStatus::INATIVO->value);

        $this->postJson("{$c['base']}/esqueceu-senha", ['email' => $convidado->email])->assertOk();
        Event::assertDispatched(UsuarioEsqueceuSenha::class);

        Event::fake([UsuarioEsqueceuSenha::class]);

        $this->postJson("{$c['base']}/esqueceu-senha", ['email' => $inativo->email])->assertOk();
        Event::assertNotDispatched(UsuarioEsqueceuSenha::class);
    });

    // -----------------------------------------------------------------------------------
    // Redefinir senha
    // -----------------------------------------------------------------------------------

    test("[{$entidade}] redefinir-senha: troca a senha, dispara o evento de aviso e encerra as sessões ativas do usuário", function () use ($entidade) {
        Event::fake([SenhaUsuarioAlterada::class]);

        $c = cenarioAuthFluxo($entidade);
        $usuario = criarUsuarioAuthFluxo($c['grupo'], "redefinir.{$entidade}@exemplo.com");

        $sessaoAntiga = UsuarioSessao::create([
            'usuario_id' => $usuario->id,
            'ativo' => true,
            'ultimo_acesso_em' => now(),
        ]);

        $token = app(TokenResetSenhaService::class)->gerarToken($usuario);

        $validar = $this->getJson("{$c['base']}/redefinir-senha/validar?token={$token}")->assertOk();
        expect($validar->json('data.email'))->toBe($usuario->email);

        $this->postJson("{$c['base']}/redefinir-senha", [
            'token' => $token,
            'senha' => 'NovaSenha@456',
            'senha_confirma' => 'NovaSenha@456',
        ])->assertStatus(204);

        expect(\Illuminate\Support\Facades\Hash::check('NovaSenha@456', $usuario->fresh()->senha))->toBeTrue();
        expect($sessaoAntiga->fresh()->ativo)->toBeFalse();

        Event::assertDispatched(SenhaUsuarioAlterada::class, function ($event) use ($usuario) {
            return $event->usuario->is($usuario);
        });

        // A senha antiga não funciona mais, a nova sim.
        $this->postJson("{$c['base']}/login", ['email' => $usuario->email, 'senha' => 'Senha123@'])
            ->assertStatus(401);

        $this->postJson("{$c['base']}/login", ['email' => $usuario->email, 'senha' => 'NovaSenha@456'])
            ->assertOk();
    });

    test("[{$entidade}] redefinir-senha: token expirado é rejeitado mesmo existindo no banco", function () use ($entidade) {
        $c = cenarioAuthFluxo($entidade);
        $usuario = criarUsuarioAuthFluxo($c['grupo'], "redefinir.expirado.{$entidade}@exemplo.com");

        $token = app(TokenResetSenhaService::class)->gerarToken($usuario);

        TokenResetSenha::where('usuario_id', $usuario->id)->update([
            'expira_em' => now()->subMinute(),
        ]);

        $this->getJson("{$c['base']}/redefinir-senha/validar?token={$token}")
            ->assertStatus(400)
            ->assertJsonPath('errors.business.0', 'Token inválido ou expirado.');

        $this->postJson("{$c['base']}/redefinir-senha", [
            'token' => $token,
            'senha' => 'NovaSenha@456',
            'senha_confirma' => 'NovaSenha@456',
        ])->assertStatus(400);

        expect(\Illuminate\Support\Facades\Hash::check('Senha123@', $usuario->fresh()->senha))->toBeTrue();
    });

    // -----------------------------------------------------------------------------------
    // Refresh / Logout / Me
    // -----------------------------------------------------------------------------------

    test("[{$entidade}] refresh gera um novo token válido a partir do atual", function () use ($entidade) {
        $c = cenarioAuthFluxo($entidade);
        $usuario = criarUsuarioAuthFluxo($c['grupo'], "refresh.{$entidade}@exemplo.com");
        $token = autenticarAuthFluxo($usuario);

        $refresh = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("{$c['base']}/refresh")
            ->assertOk();

        $novoToken = $refresh->json('data.token');
        expect($novoToken)->not->toBeEmpty();
        expect($novoToken)->not->toBe($token);

        $this->withHeader('Authorization', "Bearer {$novoToken}")
            ->getJson("{$c['base']}/me")
            ->assertOk();
    });

    test("[{$entidade}] refresh falha depois que a sessão foi encerrada por logout", function () use ($entidade) {
        $c = cenarioAuthFluxo($entidade);
        $usuario = criarUsuarioAuthFluxo($c['grupo'], "refresh.logout.{$entidade}@exemplo.com");
        $token = autenticarAuthFluxo($usuario);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("{$c['base']}/logout")
            ->assertOk();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("{$c['base']}/refresh")
            ->assertStatus(401);
    });

    test("[{$entidade}] logout encerra a sessão e o mesmo token não autentica mais em nenhuma rota protegida", function () use ($entidade) {
        $c = cenarioAuthFluxo($entidade);
        $usuario = criarUsuarioAuthFluxo($c['grupo'], "logout.{$entidade}@exemplo.com");
        $token = autenticarAuthFluxo($usuario);

        $sessao = UsuarioSessao::where('usuario_id', $usuario->id)->first();
        expect($sessao->ativo)->toBeTrue();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("{$c['base']}/logout")
            ->assertOk()
            ->assertJsonPath('data.message', 'Desconectado com sucesso');

        expect($sessao->fresh()->ativo)->toBeFalse();
        expect($sessao->fresh()->logout_em)->not->toBeNull();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("{$c['base']}/me")
            ->assertStatus(401);
    });

    test("[{$entidade}] logout sem token de autenticação é rejeitado", function () use ($entidade) {
        $c = cenarioAuthFluxo($entidade);

        $this->postJson("{$c['base']}/logout")->assertStatus(401);
    });

    test("[{$entidade}] /me retorna os dados do usuário autenticado e a lista de permissões do grupo", function () use ($entidade) {
        $c = cenarioAuthFluxo($entidade);
        $usuario = criarUsuarioAuthFluxo($c['grupo'], "me.{$entidade}@exemplo.com");
        $token = autenticarAuthFluxo($usuario);

        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson("{$c['base']}/me")
            ->assertOk()
            ->assertJsonPath('data.id', $usuario->id)
            ->assertJsonPath('data.email', $usuario->email)
            ->assertJsonPath('data.grupo', $c['grupo']->descricao)
            ->assertJsonPath('data.permissoes', []);
    });

    test("[{$entidade}] /me sem token de autenticação é rejeitado", function () use ($entidade) {
        $c = cenarioAuthFluxo($entidade);

        $this->getJson("{$c['base']}/me")->assertStatus(401);
    });
}
