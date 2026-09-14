<?php

use Illuminate\Foundation\Testing\RefreshDatabase;

use Tymon\JWTAuth\Facades\JWTAuth;

use App\Models\Usuario;
use App\Models\Grupo;
use App\Models\EntidadeTipo;
use App\Models\UsuarioSessao;
use App\Models\Banner;
use App\Models\Permissao;

use App\Enums\UsuarioStatus;
use App\Enums\BannerStatus;
use App\Enums\BannerDirecionamentoTipo;

uses(RefreshDatabase::class);

// 1x1 PNG transparente — usado como conteúdo base64 válido nos testes.
const BANNER_IMAGEM_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

/**
 * Mesmo helper usado em ReleaseTest/AcessoSuporteTest — replica o que
 * AuthController::login() faz para passar pela validação de sessão do
 * middleware `jwt`.
 */
function autenticarUsuarioBanner(Usuario $usuario): string
{
    $sessao = UsuarioSessao::create([
        'usuario_id' => $usuario->id,
        'ativo' => true,
        'ultimo_acesso_em' => now(),
    ]);

    return JWTAuth::claims(['session_id' => $sessao->id])->fromUser($usuario);
}

function concederPermissaoBanner(Grupo $grupo, string $chave): void
{
    $permissao = Permissao::create([
        'chave' => $chave,
        'descricao' => $chave,
    ]);

    $grupo->permissoes()->attach($permissao->id);
}

function criarCenarioBanner(): array
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
        'email' => 'admin.banner@exemplo.com',
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
        'email' => 'cliente.banner@exemplo.com',
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

function criarBanner(array $overrides = []): Banner
{
    return Banner::create(array_merge([
        'titulo' => 'Campanha de teste',
        'conteudo' => 'Conteúdo de teste',
        'status' => BannerStatus::ATIVO->value,
        'direcionamento_tipo' => BannerDirecionamentoTipo::GERAL->value,
        'entidade_tipo_id' => null,
        'inicio_em' => now()->subDay(),
        'fim_em' => now()->addDays(10),
    ], $overrides));
}

// ---------------------------------------------------------------------
// Admin — cadastro/validações
// ---------------------------------------------------------------------

test('admin consegue cadastrar um banner com imagem, link e direcionamento geral', function () {
    $cenario = criarCenarioBanner();
    concederPermissaoBanner($cenario['grupoAdmin'], 'admin.banner.cadastrar');

    $token = autenticarUsuarioBanner($cenario['admin']);

    $resposta = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/admin/banners', [
            'titulo' => 'Campanha de lançamento',
            'conteudo' => 'Confira a novidade.',
            'inicio_em' => now()->toDateTimeString(),
            'fim_em' => now()->addDays(5)->toDateTimeString(),
            'direcionamento' => ['tipo' => 'geral'],
            'imagens' => [
                ['nome' => 'banner.png', 'conteudo' => BANNER_IMAGEM_BASE64],
            ],
            'links' => [
                ['nome' => 'Conheça a campanha', 'url' => 'https://exemplo.com/campanha'],
            ],
        ]);

    $resposta->assertStatus(201)
        ->assertJsonPath('data.titulo', 'Campanha de lançamento')
        ->assertJsonPath('data.direcionamento.tipo', 'geral')
        ->assertJsonCount(1, 'data.imagens')
        ->assertJsonCount(1, 'data.links')
        ->assertJsonPath('data.links.0.nome', 'Conheça a campanha');
});

test('título é obrigatório no cadastro do banner', function () {
    $cenario = criarCenarioBanner();
    concederPermissaoBanner($cenario['grupoAdmin'], 'admin.banner.cadastrar');

    $token = autenticarUsuarioBanner($cenario['admin']);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/admin/banners', [
            'inicio_em' => now()->toDateTimeString(),
            'direcionamento' => ['tipo' => 'geral'],
            'imagens' => [
                ['nome' => 'banner.png', 'conteudo' => BANNER_IMAGEM_BASE64],
            ],
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['titulo']);
});

test('ao menos uma imagem é obrigatória no cadastro do banner', function () {
    $cenario = criarCenarioBanner();
    concederPermissaoBanner($cenario['grupoAdmin'], 'admin.banner.cadastrar');

    $token = autenticarUsuarioBanner($cenario['admin']);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/admin/banners', [
            'titulo' => 'Sem imagem',
            'inicio_em' => now()->toDateTimeString(),
            'direcionamento' => ['tipo' => 'geral'],
            'imagens' => [],
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['imagens']);
});

test('admin consegue cadastrar um banner com múltiplas imagens e múltiplos links', function () {
    $cenario = criarCenarioBanner();
    concederPermissaoBanner($cenario['grupoAdmin'], 'admin.banner.cadastrar');

    $token = autenticarUsuarioBanner($cenario['admin']);

    $resposta = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/admin/banners', [
            'titulo' => 'Campanha com múltiplas imagens',
            'inicio_em' => now()->toDateTimeString(),
            'direcionamento' => ['tipo' => 'geral'],
            'imagens' => [
                ['nome' => 'banner-1.png', 'conteudo' => BANNER_IMAGEM_BASE64],
                ['nome' => 'banner-2.png', 'conteudo' => BANNER_IMAGEM_BASE64],
                ['nome' => 'banner-3.png', 'conteudo' => BANNER_IMAGEM_BASE64],
            ],
            'links' => [
                ['nome' => 'Link 1', 'url' => 'https://exemplo.com/1'],
                ['nome' => 'Link 2', 'url' => 'https://exemplo.com/2'],
            ],
        ]);

    $resposta->assertStatus(201)
        ->assertJsonCount(3, 'data.imagens')
        ->assertJsonCount(2, 'data.links');
});

test('direcionamento por entidade exige a entidade de destino', function () {
    $cenario = criarCenarioBanner();
    concederPermissaoBanner($cenario['grupoAdmin'], 'admin.banner.cadastrar');

    $token = autenticarUsuarioBanner($cenario['admin']);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/admin/banners', [
            'titulo' => 'Campanha por entidade',
            'inicio_em' => now()->toDateTimeString(),
            'direcionamento' => ['tipo' => 'entidade'],
            'imagens' => [
                ['nome' => 'banner.png', 'conteudo' => BANNER_IMAGEM_BASE64],
            ],
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['direcionamento.entidade_tipo']);
});

test('usuário sem permissão não consegue cadastrar banner', function () {
    $cenario = criarCenarioBanner();
    $token = autenticarUsuarioBanner($cenario['admin']);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/admin/banners', [
            'titulo' => 'Sem permissão',
            'inicio_em' => now()->toDateTimeString(),
            'direcionamento' => ['tipo' => 'geral'],
            'imagens' => [
                ['nome' => 'banner.png', 'conteudo' => BANNER_IMAGEM_BASE64],
            ],
        ])
        ->assertStatus(403);
});

test('admin autorizado consegue listar banners', function () {
    $cenario = criarCenarioBanner();
    concederPermissaoBanner($cenario['grupoAdmin'], 'admin.banner.listar');

    criarBanner(['titulo' => 'Banner 1']);
    criarBanner(['titulo' => 'Banner 2']);

    $token = autenticarUsuarioBanner($cenario['admin']);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/admin/banners')
        ->assertStatus(200)
        ->assertJsonCount(2, 'data');
});

test('admin consegue ativar e desativar um banner', function () {
    $cenario = criarCenarioBanner();
    concederPermissaoBanner($cenario['grupoAdmin'], 'admin.banner.atualizar');

    $banner = criarBanner(['status' => BannerStatus::ATIVO->value]);

    $token = autenticarUsuarioBanner($cenario['admin']);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->patchJson("/api/admin/banners/{$banner->id}/desativar")
        ->assertStatus(200)
        ->assertJsonPath('data.status', 'inativo');

    $this->withHeader('Authorization', "Bearer {$token}")
        ->patchJson("/api/admin/banners/{$banner->id}/ativar")
        ->assertStatus(200)
        ->assertJsonPath('data.status', 'ativo');
});

test('admin consegue excluir um banner (soft delete)', function () {
    $cenario = criarCenarioBanner();
    concederPermissaoBanner($cenario['grupoAdmin'], 'admin.banner.excluir');

    $banner = criarBanner();

    $token = autenticarUsuarioBanner($cenario['admin']);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->deleteJson("/api/admin/banners/{$banner->id}")
        ->assertStatus(204);

    expect(Banner::find($banner->id))->toBeNull();
    expect(Banner::withTrashed()->find($banner->id))->not->toBeNull();
});

// ---------------------------------------------------------------------
// Private — consulta de disponibilidade
// ---------------------------------------------------------------------

test('admin consegue atualizar um banner mantendo a imagem existente e adicionando uma nova, sem informar nome da imagem existente', function () {
    // Regressão: o payload de edição envia imagens existentes só com
    // `id` (sem `nome`) — ver BannerFormEdit.tsx. Isso não pode mais
    // disparar "imagens.0.nome é obrigatório" (ver AtualizarRequest).
    $cenario = criarCenarioBanner();
    concederPermissaoBanner($cenario['grupoAdmin'], 'admin.banner.atualizar');

    $banner = criarBanner();
    $imagemExistente = \App\Models\BannerImagem::create([
        'banner_id' => $banner->id,
        'caminho' => 'banners/' . $banner->id . '/existente.png',
        'mime_type' => 'image/png',
        'tamanho' => 100,
        'ordem' => 0,
    ]);

    $token = autenticarUsuarioBanner($cenario['admin']);

    $resposta = $this->withHeader('Authorization', "Bearer {$token}")
        ->putJson("/api/admin/banners/{$banner->id}", [
            'titulo' => $banner->titulo,
            'inicio_em' => $banner->inicio_em->toDateTimeString(),
            'direcionamento' => ['tipo' => 'geral'],
            'imagens' => [
                // Imagem existente mantida — só com `id`, sem `nome`.
                ['id' => $imagemExistente->id],
                // Imagem nova adicionada durante a edição.
                ['nome' => 'nova.png', 'conteudo' => BANNER_IMAGEM_BASE64],
            ],
            'links' => [],
        ]);

    $resposta->assertStatus(200)
        ->assertJsonCount(2, 'data.imagens');
});

test('private não vê nenhum banner quando não há campanhas elegíveis', function () {
    $cenario = criarCenarioBanner();
    $token = autenticarUsuarioBanner($cenario['private']);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/banners/disponiveis')
        ->assertStatus(200)
        ->assertJsonCount(0, 'data');
});

test('private vê um banner ativo, dentro do período e direcionado a todos', function () {
    $cenario = criarCenarioBanner();
    $banner = criarBanner();

    $token = autenticarUsuarioBanner($cenario['private']);

    $resposta = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/banners/disponiveis')
        ->assertStatus(200)
        ->assertJsonCount(1, 'data');

    expect($resposta->json('data.0.id'))->toBe($banner->id);
});

test('private vê um banner direcionado à sua própria entidade', function () {
    $cenario = criarCenarioBanner();
    criarBanner([
        'direcionamento_tipo' => BannerDirecionamentoTipo::ENTIDADE->value,
        'entidade_tipo_id' => $cenario['entidadeTipoPrivate']->id,
    ]);

    $token = autenticarUsuarioBanner($cenario['private']);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/banners/disponiveis')
        ->assertStatus(200)
        ->assertJsonCount(1, 'data');
});

test('private não vê um banner direcionado à entidade admin', function () {
    $cenario = criarCenarioBanner();
    criarBanner([
        'direcionamento_tipo' => BannerDirecionamentoTipo::ENTIDADE->value,
        'entidade_tipo_id' => $cenario['entidadeTipoAdmin']->id,
    ]);

    $token = autenticarUsuarioBanner($cenario['private']);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/banners/disponiveis')
        ->assertStatus(200)
        ->assertJsonCount(0, 'data');
});

test('private não vê um banner inativo', function () {
    $cenario = criarCenarioBanner();
    criarBanner(['status' => BannerStatus::INATIVO->value]);

    $token = autenticarUsuarioBanner($cenario['private']);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/banners/disponiveis')
        ->assertStatus(200)
        ->assertJsonCount(0, 'data');
});

test('private não vê um banner com campanha expirada', function () {
    $cenario = criarCenarioBanner();
    criarBanner([
        'inicio_em' => now()->subDays(10),
        'fim_em' => now()->subDay(),
    ]);

    $token = autenticarUsuarioBanner($cenario['private']);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/banners/disponiveis')
        ->assertStatus(200)
        ->assertJsonCount(0, 'data');
});

test('private não vê um banner cuja campanha ainda não começou', function () {
    $cenario = criarCenarioBanner();
    criarBanner([
        'inicio_em' => now()->addDays(2),
        'fim_em' => now()->addDays(10),
    ]);

    $token = autenticarUsuarioBanner($cenario['private']);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/banners/disponiveis')
        ->assertStatus(200)
        ->assertJsonCount(0, 'data');
});

test('consulta de disponibilidade retorna somente banners elegíveis, mesmo havendo vários não elegíveis', function () {
    $cenario = criarCenarioBanner();

    $elegivel = criarBanner(['titulo' => 'Elegível']);
    criarBanner(['titulo' => 'Inativo', 'status' => BannerStatus::INATIVO->value]);
    criarBanner(['titulo' => 'Expirado', 'inicio_em' => now()->subDays(10), 'fim_em' => now()->subDay()]);
    criarBanner([
        'titulo' => 'Outra entidade',
        'direcionamento_tipo' => BannerDirecionamentoTipo::ENTIDADE->value,
        'entidade_tipo_id' => $cenario['entidadeTipoAdmin']->id,
    ]);

    $token = autenticarUsuarioBanner($cenario['private']);

    $resposta = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/banners/disponiveis')
        ->assertStatus(200)
        ->assertJsonCount(1, 'data');

    expect($resposta->json('data.0.id'))->toBe($elegivel->id);
});

// ---------------------------------------------------------------------
// Admin — consulta de disponibilidade (item 8 do pedido: banner não
// aparecia para o Admin mesmo quando direcionado ao público admin, pois
// não existia endpoint equivalente ao `/banners/disponiveis` do Private)
// ---------------------------------------------------------------------

test('admin vê um banner direcionado à sua própria entidade', function () {
    $cenario = criarCenarioBanner();
    $banner = criarBanner([
        'direcionamento_tipo' => BannerDirecionamentoTipo::ENTIDADE->value,
        'entidade_tipo_id' => $cenario['entidadeTipoAdmin']->id,
    ]);

    $token = autenticarUsuarioBanner($cenario['admin']);

    $resposta = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/admin/banners/disponiveis')
        ->assertStatus(200)
        ->assertJsonCount(1, 'data');

    expect($resposta->json('data.0.id'))->toBe($banner->id);
});

test('admin vê um banner direcionado a todos', function () {
    $cenario = criarCenarioBanner();
    $banner = criarBanner();

    $token = autenticarUsuarioBanner($cenario['admin']);

    $resposta = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/admin/banners/disponiveis')
        ->assertStatus(200)
        ->assertJsonCount(1, 'data');

    expect($resposta->json('data.0.id'))->toBe($banner->id);
});

test('admin não vê um banner direcionado exclusivamente à entidade private', function () {
    $cenario = criarCenarioBanner();
    criarBanner([
        'direcionamento_tipo' => BannerDirecionamentoTipo::ENTIDADE->value,
        'entidade_tipo_id' => $cenario['entidadeTipoPrivate']->id,
    ]);

    $token = autenticarUsuarioBanner($cenario['admin']);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/admin/banners/disponiveis')
        ->assertStatus(200)
        ->assertJsonCount(0, 'data');
});

test('admin não vê um banner inativo nem um banner fora do período', function () {
    $cenario = criarCenarioBanner();
    criarBanner(['status' => BannerStatus::INATIVO->value]);
    criarBanner(['inicio_em' => now()->addDays(2), 'fim_em' => now()->addDays(10)]);

    $token = autenticarUsuarioBanner($cenario['admin']);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/admin/banners/disponiveis')
        ->assertStatus(200)
        ->assertJsonCount(0, 'data');
});

test('endpoint de disponibilidade do admin não exige nenhuma permissão administrativa específica', function () {
    // Mesmo espírito do Private: é uma exibição, não uma ação de gestão —
    // por isso nenhuma permissão é concedida ao grupo aqui de propósito.
    $cenario = criarCenarioBanner();
    criarBanner();

    $token = autenticarUsuarioBanner($cenario['admin']);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/admin/banners/disponiveis')
        ->assertStatus(200);
});
