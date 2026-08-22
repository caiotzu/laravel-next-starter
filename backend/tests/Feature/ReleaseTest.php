<?php

use Illuminate\Foundation\Testing\RefreshDatabase;

use Tymon\JWTAuth\Facades\JWTAuth;

use App\Models\Usuario;
use App\Models\Grupo;
use App\Models\EntidadeTipo;
use App\Models\UsuarioSessao;
use App\Models\Release;
use App\Models\Permissao;

use App\Enums\UsuarioStatus;
use App\Enums\ReleaseTipo;
use App\Enums\ReleaseStatus;

uses(RefreshDatabase::class);

/**
 * Mesmo helper usado em AcessoSuporteTest — replica o que
 * AuthController::login() faz para passar pela validação de sessão do
 * middleware `jwt`.
 */
function autenticarUsuarioRelease(Usuario $usuario): string
{
    $sessao = UsuarioSessao::create([
        'usuario_id' => $usuario->id,
        'ativo' => true,
        'ultimo_acesso_em' => now(),
    ]);

    return JWTAuth::claims(['session_id' => $sessao->id])->fromUser($usuario);
}

function concederPermissaoRelease(Grupo $grupo, string $chave): void
{
    $permissao = Permissao::create([
        'chave' => $chave,
        'descricao' => $chave,
    ]);

    $grupo->permissoes()->attach($permissao->id);
}

/**
 * Monta um Admin e um Private, cada um com seu EntidadeTipo — usado para
 * provar isolamento de contexto entre as duas áreas.
 */
function criarCenarioRelease(): array
{
    $entidadeTipoAdmin = EntidadeTipo::create(['chave' => 'admin', 'entidade_tabela' => null]);
    $entidadeTipoPrivate = EntidadeTipo::create(['chave' => 'private', 'entidade_tabela' => 'grupo_empresas']);

    $grupoAdmin = Grupo::create([
        'descricao' => 'Desenvolvimento',
        'entidade_tipo_id' => $entidadeTipoAdmin->id,
        'entidade_id' => null,
    ]);

    $admin = Usuario::create([
        'grupo_id' => $grupoAdmin->id,
        'nome' => 'Admin Teste',
        'email' => 'admin.release@exemplo.com',
        'senha' => bcrypt('Senha123@'),
        'status' => UsuarioStatus::ATIVO->value,
    ]);

    $grupoPrivate = Grupo::create([
        'descricao' => 'Administrador',
        'entidade_tipo_id' => $entidadeTipoPrivate->id,
        'entidade_id' => null,
    ]);

    $private = Usuario::create([
        'grupo_id' => $grupoPrivate->id,
        'nome' => 'Cliente Teste',
        'email' => 'cliente.release@exemplo.com',
        'senha' => bcrypt('Senha123@'),
        'status' => UsuarioStatus::ATIVO->value,
    ]);

    return [
        'entidadeTipoAdmin' => $entidadeTipoAdmin,
        'entidadeTipoPrivate' => $entidadeTipoPrivate,
        'grupoAdmin' => $grupoAdmin,
        'grupoPrivate' => $grupoPrivate,
        'admin' => $admin,
        'private' => $private,
    ];
}

function criarRelease(EntidadeTipo $entidadeTipo, array $overrides = []): Release
{
    return Release::create(array_merge([
        'entidade_tipo_id' => $entidadeTipo->id,
        'titulo' => 'Título de teste',
        'conteudo' => 'Conteúdo de teste',
        'tipo' => ReleaseTipo::FEATURE,
        'versao' => '1.0.0',
        'status' => ReleaseStatus::DRAFT,
    ], $overrides));
}

test('private só enxerga releases publicadas do próprio contexto', function () {
    $cenario = criarCenarioRelease();
    concederPermissaoRelease($cenario['grupoPrivate'], 'private.release.listar');

    $publicadaPrivate = criarRelease($cenario['entidadeTipoPrivate'], [
        'status' => ReleaseStatus::PUBLISHED,
        'publicado_em' => now(),
    ]);
    criarRelease($cenario['entidadeTipoPrivate'], ['status' => ReleaseStatus::DRAFT]);
    criarRelease($cenario['entidadeTipoAdmin'], [
        'status' => ReleaseStatus::PUBLISHED,
        'publicado_em' => now(),
    ]);

    $token = autenticarUsuarioRelease($cenario['private']);

    $resposta = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/releases')
        ->assertStatus(200)
        ->assertJsonCount(1, 'data');

    expect($resposta->json('data.0.id'))->toBe($publicadaPrivate->id);
});

test('private não consegue visualizar diretamente uma release do contexto admin', function () {
    $cenario = criarCenarioRelease();
    concederPermissaoRelease($cenario['grupoPrivate'], 'private.release.listar');

    $releaseAdmin = criarRelease($cenario['entidadeTipoAdmin'], [
        'status' => ReleaseStatus::PUBLISHED,
        'publicado_em' => now(),
    ]);

    $token = autenticarUsuarioRelease($cenario['private']);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson("/api/releases/{$releaseAdmin->id}")
        ->assertStatus(404);
});

test('private não consegue visualizar uma release em rascunho do próprio contexto', function () {
    $cenario = criarCenarioRelease();
    concederPermissaoRelease($cenario['grupoPrivate'], 'private.release.listar');

    $rascunho = criarRelease($cenario['entidadeTipoPrivate'], ['status' => ReleaseStatus::DRAFT]);

    $token = autenticarUsuarioRelease($cenario['private']);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson("/api/releases/{$rascunho->id}")
        ->assertStatus(404);
});

test('listagem de releases é paginada no Private', function () {
    $cenario = criarCenarioRelease();
    concederPermissaoRelease($cenario['grupoPrivate'], 'private.release.listar');

    for ($i = 0; $i < 3; $i++) {
        criarRelease($cenario['entidadeTipoPrivate'], [
            'status' => ReleaseStatus::PUBLISHED,
            'publicado_em' => now()->subMinutes($i),
        ]);
    }

    $token = autenticarUsuarioRelease($cenario['private']);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/releases?por_pagina=2')
        ->assertStatus(200)
        ->assertJsonPath('meta.per_page', 2)
        ->assertJsonPath('meta.total', 3)
        ->assertJsonCount(2, 'data');
});

test('admin consegue cadastrar, atualizar e publicar uma release', function () {
    $cenario = criarCenarioRelease();
    concederPermissaoRelease($cenario['grupoAdmin'], 'admin.release.cadastrar');
    concederPermissaoRelease($cenario['grupoAdmin'], 'admin.release.editar');
    concederPermissaoRelease($cenario['grupoAdmin'], 'admin.release.publicar');
    concederPermissaoRelease($cenario['grupoAdmin'], 'admin.release.listar');

    $token = autenticarUsuarioRelease($cenario['admin']);

    $respostaCadastro = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/admin/releases', [
            'contexto' => 'private',
            'titulo' => 'Nova funcionalidade X',
            'conteudo' => 'Descrição da funcionalidade X.',
            'tipo' => 'feature',
            'versao' => '1.5.0',
        ])
        ->assertStatus(201)
        ->assertJsonPath('data.status', 'draft');

    $releaseId = $respostaCadastro->json('data.id');

    // Ainda em rascunho — não aparece para o Private.
    concederPermissaoRelease($cenario['grupoPrivate'], 'private.release.listar');
    $tokenPrivate = autenticarUsuarioRelease($cenario['private']);
    $this->withHeader('Authorization', "Bearer {$tokenPrivate}")
        ->getJson('/api/releases')
        ->assertJsonCount(0, 'data');

    $this->withHeader('Authorization', "Bearer {$token}")
        ->putJson("/api/admin/releases/{$releaseId}", ['titulo' => 'Nova funcionalidade X (revisada)'])
        ->assertStatus(200)
        ->assertJsonPath('data.titulo', 'Nova funcionalidade X (revisada)');

    $this->withHeader('Authorization', "Bearer {$token}")
        ->patchJson("/api/admin/releases/{$releaseId}/publicar")
        ->assertStatus(200)
        ->assertJsonPath('data.status', 'published');

    // Agora publicada — o Private do contexto correto passa a ver.
    $this->withHeader('Authorization', "Bearer {$tokenPrivate}")
        ->getJson('/api/releases')
        ->assertJsonCount(1, 'data');
});

test('usuário sem permissão de gerenciamento não consegue cadastrar release', function () {
    $cenario = criarCenarioRelease();
    // Nenhuma permissão de release concedida ao grupo Admin.

    $token = autenticarUsuarioRelease($cenario['admin']);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/admin/releases', [
            'contexto' => 'private',
            'titulo' => 'Tentativa não autorizada',
            'conteudo' => 'x',
            'tipo' => 'feature',
            'versao' => '1.0.0',
        ])
        ->assertStatus(403);
});

test('admin consegue filtrar releases por contexto e status na listagem administrativa', function () {
    $cenario = criarCenarioRelease();
    concederPermissaoRelease($cenario['grupoAdmin'], 'admin.release.listar');

    criarRelease($cenario['entidadeTipoAdmin'], ['status' => ReleaseStatus::DRAFT]);
    criarRelease($cenario['entidadeTipoPrivate'], ['status' => ReleaseStatus::PUBLISHED, 'publicado_em' => now()]);
    criarRelease($cenario['entidadeTipoPrivate'], ['status' => ReleaseStatus::DRAFT]);

    $token = autenticarUsuarioRelease($cenario['admin']);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/admin/releases?contexto=private&status=draft')
        ->assertStatus(200)
        ->assertJsonCount(1, 'data');

    // Sem filtro, admin vê todas (qualquer contexto/status).
    $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/admin/releases')
        ->assertStatus(200)
        ->assertJsonCount(3, 'data');
});

test('endpoint de versão não exige autenticação e retorna a versão configurada', function () {
    config(['app.platform_version' => '2.3.1']);

    $this->getJson('/api/version')
        ->assertStatus(200)
        ->assertJsonPath('data.version', '2.3.1');
});
