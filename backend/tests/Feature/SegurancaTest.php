<?php

/**
 * Testes de regressão das correções da revisão de segurança (ver docs/relatorio-seguranca).
 * Cada teste prova UMA correção e falharia com o comportamento anterior.
 */

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;

use PragmaRX\Google2FA\Google2FA;
use Tymon\JWTAuth\Facades\JWTAuth;

use App\Events\SenhaUsuarioAlterada;

use App\Models\Usuario;
use App\Models\Grupo;
use App\Models\EntidadeTipo;
use App\Models\UsuarioSessao;
use App\Models\Permissao;
use App\Models\Chamado;

use App\Enums\UsuarioStatus;

uses(RefreshDatabase::class);

function autenticarSeg(Usuario $usuario): array
{
    $sessao = UsuarioSessao::create([
        'usuario_id' => $usuario->id,
        'ativo' => true,
        'ultimo_acesso_em' => now(),
    ]);

    return [
        'token' => JWTAuth::claims(['session_id' => $sessao->id])->fromUser($usuario),
        'sessao' => $sessao,
    ];
}

function permitirSeg(Grupo $grupo, string ...$chaves): void
{
    foreach ($chaves as $chave) {
        $permissao = Permissao::firstOrCreate(['chave' => $chave], ['descricao' => $chave]);
        $grupo->permissoes()->syncWithoutDetaching([$permissao->id]);
    }
}

function criarUsuarioSeg(Grupo $grupo, string $email, array $extra = []): Usuario
{
    return Usuario::create(array_merge([
        'grupo_id' => $grupo->id,
        'nome' => 'Usuário ' . $email,
        'email' => $email,
        'senha' => bcrypt('Senha123@'),
        'status' => UsuarioStatus::ATIVO->value,
    ], $extra));
}

function cenarioSeg(): array
{
    $tipoAdmin = EntidadeTipo::create(['chave' => 'admin', 'entidade_tabela' => null]);
    $tipoPrivate = EntidadeTipo::create(['chave' => 'private', 'entidade_tabela' => 'grupo_empresas']);

    $grupoAdmin = Grupo::create(['descricao' => 'Admins', 'entidade_tipo_id' => $tipoAdmin->id, 'entidade_id' => null]);
    $grupoPrivate = Grupo::create(['descricao' => 'Clientes', 'entidade_tipo_id' => $tipoPrivate->id, 'entidade_id' => null]);

    return [
        'grupoAdmin' => $grupoAdmin,
        'grupoPrivate' => $grupoPrivate,
        'admin' => criarUsuarioSeg($grupoAdmin, 'admin.seg@exemplo.com'),
        'cliente' => criarUsuarioSeg($grupoPrivate, 'cliente.seg@exemplo.com'),
    ];
}

// ---------------------------------------------------------------------------------------
// Audiência (AudienciaMiddleware)
// ---------------------------------------------------------------------------------------

test('usuário private não alcança rotas /admin mesmo sem authorize() na rota', function () {
    $c = cenarioSeg();

    $cliente = autenticarSeg($c['cliente']);
    $admin = autenticarSeg($c['admin']);

    // Rotas /admin que NÃO chamam authorize(): antes, qualquer JWT válido lia.
    foreach (['/api/admin/banners/disponiveis', '/api/admin/permissoes'] as $rota) {
        $this->withHeader('Authorization', "Bearer {$cliente['token']}")
            ->getJson($rota)
            ->assertStatus(403);

        $this->withHeader('Authorization', "Bearer {$admin['token']}")
            ->getJson($rota)
            ->assertOk();
    }
});

// ---------------------------------------------------------------------------------------
// Login: enumeração de e-mails
// ---------------------------------------------------------------------------------------

test('login responde igual para e-mail inexistente e senha errada', function () {
    $c = cenarioSeg();

    $inexistente = $this->postJson('/api/admin/login', ['email' => 'naoexiste@exemplo.com', 'senha' => 'Qualquer@123']);
    $senhaErrada = $this->postJson('/api/admin/login', ['email' => $c['admin']->email, 'senha' => 'Errada@123']);

    $inexistente->assertStatus(401);
    $senhaErrada->assertStatus(401);

    expect($inexistente->json('errors.business.0'))->toBe($senhaErrada->json('errors.business.0'));
});

// ---------------------------------------------------------------------------------------
// 2FA: teto de tentativas por temp_token
// ---------------------------------------------------------------------------------------

test('temp_token do 2FA é descartado após 5 códigos inválidos', function () {
    $c = cenarioSeg();

    $google2fa = new Google2FA();
    $segredo = $google2fa->generateSecretKey();

    $c['admin']->forceFill([
        'google2fa_enable' => true,
        'google2fa_secret' => $segredo,
        'google2fa_confirmado_em' => now(),
    ])->save();

    $login = $this->postJson('/api/admin/login', ['email' => $c['admin']->email, 'senha' => 'Senha123@'])
        ->assertOk();

    $tempToken = $login->json('data.temp_token');
    expect($tempToken)->not->toBeEmpty();

    for ($i = 0; $i < 5; $i++) {
        $this->postJson('/api/admin/2fa/verificar', ['temp_token' => $tempToken, 'codigo' => '000000'])
            ->assertStatus(401);
    }

    // Mesmo com o código CORRETO, o token já foi descartado.
    $this->postJson('/api/admin/2fa/verificar', [
        'temp_token' => $tempToken,
        'codigo' => $google2fa->getCurrentOtp($segredo),
    ])->assertStatus(401);
});

test('código TOTP não pode ser reutilizado (anti-replay)', function () {
    $c = cenarioSeg();

    $google2fa = new Google2FA();
    $segredo = $google2fa->generateSecretKey();

    $service = app(\App\Services\AutenticacaoDoisFatoresService::class);
    $codigo = $google2fa->getCurrentOtp($segredo);

    expect($service->verificar($segredo, $codigo))->toBeTrue();
    expect($service->verificar($segredo, $codigo))->toBeFalse();
});

// ---------------------------------------------------------------------------------------
// Perfil: e-mail exige senha atual; troca de senha/e-mail revoga outras sessões
// ---------------------------------------------------------------------------------------

test('trocar o e-mail do perfil exige a senha atual', function () {
    $c = cenarioSeg();
    $auth = autenticarSeg($c['admin']);

    $this->withHeader('Authorization', "Bearer {$auth['token']}")
        ->patchJson('/api/admin/perfil', ['email' => 'novo.email@exemplo.com'])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['senha_atual']);

    $this->withHeader('Authorization', "Bearer {$auth['token']}")
        ->patchJson('/api/admin/perfil', ['email' => 'novo.email@exemplo.com', 'senha_atual' => 'SenhaErrada@1'])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['senha_atual']);

    expect($c['admin']->fresh()->email)->toBe('admin.seg@exemplo.com');

    $this->withHeader('Authorization', "Bearer {$auth['token']}")
        ->patchJson('/api/admin/perfil', ['email' => 'novo.email@exemplo.com', 'senha_atual' => 'Senha123@'])
        ->assertOk();

    expect($c['admin']->fresh()->email)->toBe('novo.email@exemplo.com');
});

test('alterar só o nome do perfil não exige senha', function () {
    $c = cenarioSeg();
    $auth = autenticarSeg($c['admin']);

    $this->withHeader('Authorization', "Bearer {$auth['token']}")
        ->patchJson('/api/admin/perfil', ['nome' => 'Outro Nome'])
        ->assertOk();
});

test('trocar a senha encerra as outras sessões e mantém a atual', function () {
    Event::fake([SenhaUsuarioAlterada::class]);

    $c = cenarioSeg();
    $atual = autenticarSeg($c['admin']);
    $outra = UsuarioSessao::create([
        'usuario_id' => $c['admin']->id,
        'ativo' => true,
        'ultimo_acesso_em' => now(),
    ]);

    $this->withHeader('Authorization', "Bearer {$atual['token']}")
        ->patchJson('/api/admin/perfil/senha', [
            'senha_atual' => 'Senha123@',
            'senha_nova' => 'NovaSenha@456',
            'senha_nova_confirma' => 'NovaSenha@456',
        ])
        ->assertOk();

    expect($outra->fresh()->ativo)->toBeFalse();
    expect($atual['sessao']->fresh()->ativo)->toBeTrue();
});

// ---------------------------------------------------------------------------------------
// Gestão de usuários de cliente: não pode atingir usuários Admin
// ---------------------------------------------------------------------------------------

test('atualizar status de usuário de cliente não alcança usuários admin', function () {
    $c = cenarioSeg();
    permitirSeg($c['grupoAdmin'], 'admin.grupo_empresa.usuario.atualizar_status');

    $alvoAdmin = criarUsuarioSeg($c['grupoAdmin'], 'outro.admin@exemplo.com');
    $auth = autenticarSeg($c['admin']);

    // Antes: {grupoId} da URL era usado sem checar o tipo do grupo -> bloqueava um admin.
    $this->withHeader('Authorization', "Bearer {$auth['token']}")
        ->patchJson("/api/admin/grupos-empresas/{$c['grupoAdmin']->id}/usuarios/{$alvoAdmin->id}/status", ['status' => 'bloqueado'])
        ->assertStatus(400);

    expect($alvoAdmin->fresh()->status)->toBe(UsuarioStatus::ATIVO);

    // Controle positivo: usuário de cliente continua funcionando.
    $this->withHeader('Authorization', "Bearer {$auth['token']}")
        ->patchJson("/api/admin/grupos-empresas/{$c['grupoPrivate']->id}/usuarios/{$c['cliente']->id}/status", ['status' => 'bloqueado'])
        ->assertOk();

    expect($c['cliente']->fresh()->status)->toBe(UsuarioStatus::BLOQUEADO);
});

test('não é possível alterar o status de um usuário convidado', function () {
    $c = cenarioSeg();
    permitirSeg($c['grupoAdmin'], 'admin.grupo_empresa.usuario.atualizar_status');

    $convidado = criarUsuarioSeg($c['grupoPrivate'], 'convidado@exemplo.com', [
        'senha' => null,
        'status' => UsuarioStatus::CONVIDADO->value,
    ]);
    $auth = autenticarSeg($c['admin']);

    $this->withHeader('Authorization', "Bearer {$auth['token']}")
        ->patchJson("/api/admin/grupos-empresas/{$c['grupoPrivate']->id}/usuarios/{$convidado->id}/status", ['status' => 'ativo'])
        ->assertStatus(400);

    expect($convidado->fresh()->status)->toBe(UsuarioStatus::CONVIDADO);
});

// ---------------------------------------------------------------------------------------
// Release: HTML sanitizado no servidor
// ---------------------------------------------------------------------------------------

test('conteúdo de release é sanitizado ao salvar', function () {
    $c = cenarioSeg();
    permitirSeg($c['grupoAdmin'], 'admin.release.cadastrar');
    $auth = autenticarSeg($c['admin']);

    $resposta = $this->withHeader('Authorization', "Bearer {$auth['token']}")
        ->postJson('/api/admin/releases', [
            'contexto' => 'private',
            'titulo' => 'v9.9',
            'versao' => '9.9.0',
            'tipo' => 'feature',
            'conteudo' => '<p>Novidade <strong>boa</strong></p><img src=x onerror="alert(1)"><script>alert(2)</script>'
                . '<a href="javascript:alert(3)">x</a>',
        ])
        ->assertStatus(201);

    $conteudo = $resposta->json('data.conteudo');

    expect($conteudo)
        ->toContain('<strong>boa</strong>')
        ->not->toContain('onerror')
        ->not->toContain('<script')
        ->not->toContain('javascript:')
        ->not->toContain('<img');
});

// ---------------------------------------------------------------------------------------
// Chamado: responsável deve ser Admin
// ---------------------------------------------------------------------------------------

test('responsável do chamado precisa ser um usuário admin', function () {
    $c = cenarioSeg();
    permitirSeg($c['grupoAdmin'], 'admin.chamado.gerenciar');
    permitirSeg($c['grupoPrivate'], 'private.chamado.abrir', 'private.chamado.listar');

    $tokenCliente = autenticarSeg($c['cliente'])['token'];
    $tokenAdmin = autenticarSeg($c['admin'])['token'];

    $chamadoId = $this->withHeader('Authorization', "Bearer {$tokenCliente}")
        ->postJson('/api/chamados', ['tipo' => 'duvida', 'assunto' => 'Teste', 'mensagem' => '<p>x</p>'])
        ->assertStatus(201)
        ->json('data.id');

    $this->withHeader('Authorization', "Bearer {$tokenAdmin}")
        ->patchJson("/api/admin/chamados/{$chamadoId}/responsavel", ['responsavel_id' => $c['cliente']->id])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['responsavel_id']);

    $this->withHeader('Authorization', "Bearer {$tokenAdmin}")
        ->patchJson("/api/admin/chamados/{$chamadoId}/responsavel", ['responsavel_id' => $c['admin']->id])
        ->assertOk();
});

// ---------------------------------------------------------------------------------------
// Anexos de chamado: disco privado + link assinado
// ---------------------------------------------------------------------------------------

test('anexo de chamado só é entregue por link assinado e fica fora do disco público', function () {
    Storage::fake('local');
    Storage::fake('public');

    $c = cenarioSeg();
    permitirSeg($c['grupoPrivate'], 'private.chamado.abrir', 'private.chamado.listar');
    $token = autenticarSeg($c['cliente'])['token'];

    $pdf = "%PDF-1.4\n%âãÏÓ\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>";

    $resposta = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/chamados', [
            'tipo' => 'duvida',
            'assunto' => 'Com anexo',
            'mensagem' => '<p>Segue.</p>',
            'anexos' => [['nome' => 'documento.pdf', 'conteudo' => base64_encode($pdf)]],
        ])
        ->assertStatus(201);

    $anexo = Chamado::first()->mensagens()->first()->anexos()->first();

    Storage::disk('local')->assertExists($anexo->caminhoArmazenado());
    Storage::disk('public')->assertMissing($anexo->caminhoArmazenado());

    $url = $resposta->json('data.mensagens.0.anexos.0.url');
    $partes = parse_url($url);
    $relativa = $partes['path'] . '?' . $partes['query'];

    // Sem assinatura -> 403.
    $this->get($partes['path'])->assertStatus(403);

    // Assinatura adulterada -> 403.
    $this->get($relativa . 'x')->assertStatus(403);

    // Link válido -> 200, PDF sempre como download e com nosniff.
    $download = $this->get($relativa)->assertOk();
    $download->assertHeader('X-Content-Type-Options', 'nosniff');
    expect($download->headers->get('Content-Disposition'))->toContain('attachment');
});
