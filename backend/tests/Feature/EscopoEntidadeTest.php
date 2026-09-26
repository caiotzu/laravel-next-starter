<?php

use Illuminate\Foundation\Testing\RefreshDatabase;

use Tymon\JWTAuth\Facades\JWTAuth;

use App\Models\Usuario;
use App\Models\Grupo;
use App\Models\GrupoEmpresa;
use App\Models\Empresa;
use App\Models\EmpresaContato;
use App\Models\EntidadeTipo as EntidadeTipoModel;
use App\Models\AcessoSuporte;
use App\Models\Permissao;
use App\Models\UsuarioSessao;

use App\Enums\UsuarioStatus;
use App\Enums\AcessoSuporteStatus;
use App\Enums\EmpresaContatoTipo;

/**
 * Cobre a centralização de escopo por entidade (EscopoEntidadeService) nos
 * três Services que antes duplicavam aplicarEscopoEntidade() — EmpresaService,
 * EmpresaContatoService, EmpresaEnderecoService — e a correção do bug em
 * Grupo::booted().
 *
 * Segue exatamente o mesmo padrão de cenário/autenticação já usado em
 * tests/Feature/AcessoSuporteTest.php (dois "clientes" — A e B — isolados
 * entre si, e um Admin), reaproveitado aqui em funções com sufixo "Escopo"
 * para não colidir com as funções globais já declaradas naquele arquivo.
 */
uses(RefreshDatabase::class);

function autenticarEscopo(Usuario $usuario): string
{
    $sessao = UsuarioSessao::create([
        'usuario_id' => $usuario->id,
        'ativo' => true,
        'ultimo_acesso_em' => now(),
    ]);

    return JWTAuth::claims(['session_id' => $sessao->id])->fromUser($usuario);
}

function concederPermissoesEscopo(Grupo $grupo, array $chaves): void
{
    foreach ($chaves as $chave) {
        $permissao = Permissao::firstOrCreate(
            ['chave' => $chave],
            ['descricao' => $chave]
        );

        if (! $grupo->permissoes()->where('permissao_id', $permissao->id)->exists()) {
            $grupo->permissoes()->attach($permissao->id);
        }
    }
}

/**
 * Mesmo cenário de tests/Feature/AcessoSuporteTest.php: um EntidadeTipo
 * admin e um private, um Admin, e dois clientes (grupo_empresa + grupo +
 * usuário + empresa) distintos — A e B — usados para provar isolamento
 * entre organizações diferentes.
 */
function criarCenarioEscopoEntidade(): array
{
    $entidadeTipoAdmin = EntidadeTipoModel::create(['chave' => 'admin', 'entidade_tabela' => null]);
    $entidadeTipoPrivate = EntidadeTipoModel::create(['chave' => 'private', 'entidade_tabela' => 'grupo_empresas']);

    $grupoAdmin = Grupo::create([
        'descricao' => 'Desenvolvimento',
        'entidade_tipo_id' => $entidadeTipoAdmin->id,
        'entidade_id' => null,
    ]);

    $admin = Usuario::create([
        'grupo_id' => $grupoAdmin->id,
        'nome' => 'Admin Teste',
        'email' => 'admin.escopo@exemplo.com',
        'senha' => bcrypt('Senha123@'),
        'status' => UsuarioStatus::ATIVO->value,
    ]);

    $criarCliente = function (string $sufixo) use ($entidadeTipoPrivate) {
        $grupoEmpresa = GrupoEmpresa::create(['nome' => "Cliente Escopo {$sufixo}"]);

        $grupo = Grupo::create([
            'descricao' => 'Administrador',
            'entidade_tipo_id' => $entidadeTipoPrivate->id,
            'entidade_id' => $grupoEmpresa->id,
        ]);

        $usuario = Usuario::create([
            'grupo_id' => $grupo->id,
            'nome' => "Cliente Escopo {$sufixo}",
            'email' => "cliente.escopo.{$sufixo}@exemplo.com",
            'senha' => bcrypt('Senha123@'),
            'status' => UsuarioStatus::ATIVO->value,
        ]);

        $empresa = Empresa::create([
            'grupo_empresa_id' => $grupoEmpresa->id,
            'cnpj' => $sufixo === 'a' ? '11111111000101' : '22222222000102',
            'nome_fantasia' => "Empresa Escopo {$sufixo}",
            'razao_social' => "Empresa Escopo {$sufixo} LTDA",
            'inscricao_estadual' => null,
            'inscricao_municipal' => null,
            'uf' => 'SP',
        ]);

        return compact('grupoEmpresa', 'grupo', 'usuario', 'empresa');
    };

    return [
        'grupoAdmin' => $grupoAdmin,
        'entidadeTipoAdmin' => $entidadeTipoAdmin,
        'entidadeTipoPrivate' => $entidadeTipoPrivate,
        'admin' => $admin,
        'clienteA' => $criarCliente('a'),
        'clienteB' => $criarCliente('b'),
    ];
}

function criarAcessoAtivoEscopo(array $cenario, array $overrides = []): AcessoSuporte
{
    return AcessoSuporte::create(array_merge([
        'entidade_tipo_id' => $cenario['entidadeTipoPrivate']->id,
        'entidade_id' => $cenario['clienteA']['grupoEmpresa']->id,
        'usuario_concedente_id' => $cenario['clienteA']['usuario']->id,
        'usuario_admin_id' => $cenario['admin']->id,
        'status' => AcessoSuporteStatus::ATIVO,
        'expira_em' => now()->addMinutes(30),
    ], $overrides));
}

// #region Private — consulta

test('private A consegue consultar a própria empresa', function () {
    $cenario = criarCenarioEscopoEntidade();
    concederPermissoesEscopo($cenario['clienteA']['grupo'], ['private.empresa.visualizar']);

    $token = autenticarEscopo($cenario['clienteA']['usuario']);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson("/api/empresas/{$cenario['clienteA']['empresa']->id}")
        ->assertStatus(200);
});

test('private A não consegue consultar a empresa de B', function () {
    $cenario = criarCenarioEscopoEntidade();
    concederPermissoesEscopo($cenario['clienteA']['grupo'], ['private.empresa.visualizar']);

    $token = autenticarEscopo($cenario['clienteA']['usuario']);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson("/api/empresas/{$cenario['clienteB']['empresa']->id}")
        ->assertStatus(400);
});

// #endregion Private — consulta

// #region Private — inserção (via EmpresaContato, já que Empresa não possui rota Private de cadastro)

test('private A consegue inserir um contato na própria empresa', function () {
    $cenario = criarCenarioEscopoEntidade();
    concederPermissoesEscopo($cenario['clienteA']['grupo'], ['private.empresa.contato.cadastrar']);

    $token = autenticarEscopo($cenario['clienteA']['usuario']);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson("/api/empresas/{$cenario['clienteA']['empresa']->id}/contatos", [
            'tipo' => EmpresaContatoTipo::EMAIL->value,
            'valor' => 'contato-a@exemplo.com',
            'principal' => true,
            'ativo' => true,
        ])
        ->assertStatus(201);
});

test('private A não consegue inserir um contato na empresa de B', function () {
    $cenario = criarCenarioEscopoEntidade();
    concederPermissoesEscopo($cenario['clienteA']['grupo'], ['private.empresa.contato.cadastrar']);

    $token = autenticarEscopo($cenario['clienteA']['usuario']);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson("/api/empresas/{$cenario['clienteB']['empresa']->id}/contatos", [
            'tipo' => EmpresaContatoTipo::EMAIL->value,
            'valor' => 'contato-invasor@exemplo.com',
            'principal' => true,
            'ativo' => true,
        ])
        ->assertStatus(400);

    $this->assertDatabaseMissing('empresa_contatos', [
        'valor' => 'contato-invasor@exemplo.com',
    ]);
});

// #endregion Private — inserção

// #region Private — atualização

test('private A consegue atualizar a própria empresa', function () {
    $cenario = criarCenarioEscopoEntidade();
    concederPermissoesEscopo($cenario['clienteA']['grupo'], ['private.empresa.atualizar']);

    $token = autenticarEscopo($cenario['clienteA']['usuario']);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->putJson("/api/empresas/{$cenario['clienteA']['empresa']->id}", [
            'nome_fantasia' => 'Empresa Escopo A Atualizada',
            'razao_social' => 'Empresa Escopo A Atualizada LTDA',
            'uf' => 'RJ',
        ])
        ->assertStatus(200);

    $this->assertDatabaseHas('empresas', [
        'id' => $cenario['clienteA']['empresa']->id,
        'nome_fantasia' => 'Empresa Escopo A Atualizada',
    ]);
});

test('private A não consegue atualizar a empresa de B', function () {
    $cenario = criarCenarioEscopoEntidade();
    concederPermissoesEscopo($cenario['clienteA']['grupo'], ['private.empresa.atualizar']);

    $token = autenticarEscopo($cenario['clienteA']['usuario']);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->putJson("/api/empresas/{$cenario['clienteB']['empresa']->id}", [
            'nome_fantasia' => 'Invasão',
            'razao_social' => 'Invasão LTDA',
            'uf' => 'RJ',
        ])
        ->assertStatus(400);

    $this->assertDatabaseMissing('empresas', [
        'id' => $cenario['clienteB']['empresa']->id,
        'nome_fantasia' => 'Invasão',
    ]);
});

// #endregion Private — atualização

// #region Private — exclusão (via EmpresaContato, já que Empresa não possui rota Private de exclusão)

test('private A consegue excluir um contato da própria empresa', function () {
    $cenario = criarCenarioEscopoEntidade();
    concederPermissoesEscopo($cenario['clienteA']['grupo'], ['private.empresa.contato.excluir']);

    $contato = EmpresaContato::create([
        'empresa_id' => $cenario['clienteA']['empresa']->id,
        'tipo' => EmpresaContatoTipo::EMAIL->value,
        'valor' => 'contato-a@exemplo.com',
        'principal' => true,
        'ativo' => true,
    ]);

    $token = autenticarEscopo($cenario['clienteA']['usuario']);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->deleteJson("/api/empresas/{$cenario['clienteA']['empresa']->id}/contatos/{$contato->id}")
        ->assertStatus(204);

    $this->assertSoftDeleted('empresa_contatos', ['id' => $contato->id]);
});

test('private A não consegue excluir um contato da empresa de B', function () {
    $cenario = criarCenarioEscopoEntidade();
    concederPermissoesEscopo($cenario['clienteA']['grupo'], ['private.empresa.contato.excluir']);

    $contatoB = EmpresaContato::create([
        'empresa_id' => $cenario['clienteB']['empresa']->id,
        'tipo' => EmpresaContatoTipo::EMAIL->value,
        'valor' => 'contato-b@exemplo.com',
        'principal' => true,
        'ativo' => true,
    ]);

    $token = autenticarEscopo($cenario['clienteA']['usuario']);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->deleteJson("/api/empresas/{$cenario['clienteB']['empresa']->id}/contatos/{$contatoB->id}")
        ->assertStatus(400);

    $this->assertDatabaseHas('empresa_contatos', ['id' => $contatoB->id, 'deleted_at' => null]);
});

// #endregion Private — exclusão

// #region Admin normal (fora de modo de suporte) — irrestrito

test('admin fora de modo de suporte enxerga empresas de A e de B', function () {
    $cenario = criarCenarioEscopoEntidade();
    concederPermissoesEscopo($cenario['grupoAdmin'], ['admin.empresa.listar']);

    $token = autenticarEscopo($cenario['admin']);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/admin/empresas');

    $response->assertStatus(200);

    $nomes = collect($response->json('data'))->pluck('nome_fantasia')->all();

    expect($nomes)->toContain('Empresa Escopo a');
    expect($nomes)->toContain('Empresa Escopo b');
});

// #endregion Admin normal

// #region Admin em modo de suporte — restrito à entidade impersonada (mesmo em rota /admin)

test('admin em modo de suporte só enxerga a empresa da entidade impersonada, mesmo pela rota /admin', function () {
    $cenario = criarCenarioEscopoEntidade();
    concederPermissoesEscopo($cenario['grupoAdmin'], ['admin.empresa.listar']);

    $acesso = criarAcessoAtivoEscopo($cenario);

    $token = autenticarEscopo($cenario['admin']);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->withHeader('X-Acesso-Suporte-Id', $acesso->id)
        ->getJson('/api/admin/empresas');

    $response->assertStatus(200);

    $nomes = collect($response->json('data'))->pluck('nome_fantasia')->all();

    expect($nomes)->toContain('Empresa Escopo a');
    expect($nomes)->not->toContain('Empresa Escopo b');
});

test('admin em modo de suporte consegue atualizar apenas a empresa impersonada, pela rota /admin', function () {
    $cenario = criarCenarioEscopoEntidade();
    concederPermissoesEscopo($cenario['grupoAdmin'], ['admin.empresa.atualizar']);

    $acesso = criarAcessoAtivoEscopo($cenario);

    $token = autenticarEscopo($cenario['admin']);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->withHeader('X-Acesso-Suporte-Id', $acesso->id)
        ->putJson("/api/admin/empresas/{$cenario['clienteA']['empresa']->id}", [
            'cnpj' => '11111111000101',
            'nome_fantasia' => 'Empresa A via suporte',
            'razao_social' => 'Empresa A via suporte LTDA',
            'uf' => 'RJ',
        ])
        ->assertStatus(200);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->withHeader('X-Acesso-Suporte-Id', $acesso->id)
        ->putJson("/api/admin/empresas/{$cenario['clienteB']['empresa']->id}", [
            'cnpj' => '22222222000102',
            'nome_fantasia' => 'Invasão via suporte',
            'razao_social' => 'Invasão via suporte LTDA',
            'uf' => 'RJ',
        ])
        ->assertStatus(400);
});

// #endregion Admin em modo de suporte

// #region Grupo::booted() — reprodução do bug relatado (item 11/12 da análise)

test('admin em modo de suporte cria Grupo no contexto da entidade impersonada, não no do Admin real', function () {
    $cenario = criarCenarioEscopoEntidade();
    concederPermissoesEscopo($cenario['grupoAdmin'], ['admin.grupo.cadastrar']);

    $acesso = criarAcessoAtivoEscopo($cenario);

    $token = autenticarEscopo($cenario['admin']);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->withHeader('X-Acesso-Suporte-Id', $acesso->id)
        ->postJson('/api/admin/grupos', [
            'descricao' => 'Grupo criado em suporte',
        ]);

    $response->assertStatus(201);

    $this->assertDatabaseHas('grupos', [
        'id' => $response->json('data.id'),
        'entidade_tipo_id' => $cenario['entidadeTipoPrivate']->id,
        'entidade_id' => $cenario['clienteA']['grupoEmpresa']->id,
    ]);
});

test('admin fora de modo de suporte cria Grupo no próprio contexto Admin', function () {
    $cenario = criarCenarioEscopoEntidade();
    concederPermissoesEscopo($cenario['grupoAdmin'], ['admin.grupo.cadastrar']);

    $token = autenticarEscopo($cenario['admin']);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/admin/grupos', [
            'descricao' => 'Grupo criado sem suporte',
        ]);

    $response->assertStatus(201);

    $this->assertDatabaseHas('grupos', [
        'id' => $response->json('data.id'),
        'entidade_tipo_id' => $cenario['entidadeTipoAdmin']->id,
        'entidade_id' => null,
    ]);
});

test('private cria Grupo no próprio contexto', function () {
    $cenario = criarCenarioEscopoEntidade();
    concederPermissoesEscopo($cenario['clienteA']['grupo'], ['private.grupo.cadastrar']);

    $token = autenticarEscopo($cenario['clienteA']['usuario']);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/grupos', [
            'descricao' => 'Grupo criado por private',
        ]);

    $response->assertStatus(201);

    $this->assertDatabaseHas('grupos', [
        'id' => $response->json('data.id'),
        'entidade_tipo_id' => $cenario['entidadeTipoPrivate']->id,
        'entidade_id' => $cenario['clienteA']['grupoEmpresa']->id,
    ]);
});

// #endregion Grupo::booted()

// #region Sem usuário autenticado

test('EscopoEntidadeService não quebra e resulta em escopo vazio quando não há usuário autenticado', function () {
    $service = app(\App\Services\EscopoEntidadeService::class);

    expect($service->usuarioAutenticado())->toBeNull();
    expect($service->irrestrito())->toBeFalse();
    expect($service->entidadeIdAtual())->toBeNull();
    expect($service->contextoParaCriacaoAutomatica())->toBeNull();

    // aplicar()/validarPertence() não devem lançar exceção mesmo sem
    // usuário autenticado — apenas resultam num escopo que não bate com
    // nada (grupo_empresa_id = null) em vez de um erro fatal.
    $query = $service->aplicar(Empresa::query());
    expect($query->count())->toBe(0);
});

// #endregion Sem usuário autenticado
