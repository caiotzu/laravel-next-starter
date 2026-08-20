<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Gate;

use Tymon\JWTAuth\Facades\JWTAuth;

use App\Models\Usuario;
use App\Models\Grupo;
use App\Models\GrupoEmpresa;
use App\Models\Empresa;
use App\Models\EntidadeTipo;
use App\Models\AcessoSuporte;
use App\Models\UsuarioSessao;
use App\Models\Auditoria;

use App\AcessoSuporte\AcessoSuporteContexto;

use App\Enums\UsuarioStatus;
use App\Enums\AcessoSuporteStatus;
use App\Enums\AcessoSuporteEncerradoPor;

uses(RefreshDatabase::class);

/**
 * O middleware `jwt` exige um claim `session_id` apontando para uma
 * UsuarioSessao ativa (ver JwtMiddleware/UsuarioSessaoService) — replica
 * aqui exatamente o que AuthController::login() faz, para os testes
 * passarem pela mesma validação de sessão que uma requisição real.
 */
function autenticar(Usuario $usuario): string
{
    $sessao = UsuarioSessao::create([
        'usuario_id' => $usuario->id,
        'ativo' => true,
        'ultimo_acesso_em' => now(),
    ]);

    return JWTAuth::claims(['session_id' => $sessao->id])->fromUser($usuario);
}

/**
 * A ação de Admin (`admin.acesso_suporte.encerrar`) não é abrangida pelo
 * bypass de Gate::before (que só cobre o namespace da entidade concedente
 * ativa), então precisa de uma permissão real vinculada ao grupo para os
 * testes que a exercitam — replica o que os seeders fazem em desenvolvimento.
 */
function concederPermissao(Grupo $grupo, string $chave): void
{
    $permissao = \App\Models\Permissao::create([
        'chave' => $chave,
        'descricao' => $chave,
    ]);

    $grupo->permissoes()->attach($permissao->id);
}

/**
 * Monta o cenário mínimo: um EntidadeTipo admin e um private, um Admin, e
 * dois "clientes" (grupo_empresa + grupo + usuário + empresa) distintos —
 * usado para provar isolamento entre organizações diferentes.
 */
function criarCenarioAcessoSuporte(): array
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
        'email' => 'admin.teste@exemplo.com',
        'senha' => bcrypt('Senha123@'),
        'status' => UsuarioStatus::ATIVO->value,
    ]);

    $criarCliente = function (string $sufixo) use ($entidadeTipoPrivate) {
        $grupoEmpresa = GrupoEmpresa::create(['nome' => "Cliente {$sufixo}"]);

        $grupo = Grupo::create([
            'descricao' => 'Administrador',
            'entidade_tipo_id' => $entidadeTipoPrivate->id,
            'entidade_id' => $grupoEmpresa->id,
        ]);

        $usuario = Usuario::create([
            'grupo_id' => $grupo->id,
            'nome' => "Cliente {$sufixo}",
            'email' => "cliente.{$sufixo}@exemplo.com",
            'senha' => bcrypt('Senha123@'),
            'status' => UsuarioStatus::ATIVO->value,
        ]);

        $empresa = Empresa::create([
            'grupo_empresa_id' => $grupoEmpresa->id,
            'cnpj' => $sufixo === 'a' ? '11111111000191' : '22222222000192',
            'nome_fantasia' => "Empresa {$sufixo}",
            'razao_social' => "Empresa {$sufixo} LTDA",
            'inscricao_estadual' => null,
            'inscricao_municipal' => null,
            'uf' => 'SP',
        ]);

        return compact('grupoEmpresa', 'grupo', 'usuario', 'empresa');
    };

    return [
        'entidadeTipoPrivate' => $entidadeTipoPrivate,
        'admin' => $admin,
        'clienteA' => $criarCliente('a'),
        'clienteB' => $criarCliente('b'),
    ];
}

function criarAcessoAtivo(array $cenario, array $overrides = []): AcessoSuporte
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

test('cliente concede acesso e o admin recebe uma mensagem automática', function () {
    $cenario = criarCenarioAcessoSuporte();

    concederPermissao($cenario['clienteA']['grupo'], 'private.acesso_suporte.cadastrar');

    $token = autenticar($cenario['clienteA']['usuario']);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/acessos-suporte', [
            'usuario_admin_id' => $cenario['admin']->id,
            'duracao_minutos' => 30,
            'motivo' => 'Erro ao gerar boleto',
        ]);

    $response->assertStatus(201);

    $this->assertDatabaseHas('acessos_suporte', [
        'usuario_admin_id' => $cenario['admin']->id,
        'usuario_concedente_id' => $cenario['clienteA']['usuario']->id,
        'entidade_id' => $cenario['clienteA']['grupoEmpresa']->id,
    ]);

    $this->assertDatabaseHas('mensagem_destinatarios', [
        'usuario_id' => $cenario['admin']->id,
    ]);
});

test('não é possível conceder acesso sem duracao_minutos (expiração obrigatória)', function () {
    $cenario = criarCenarioAcessoSuporte();

    concederPermissao($cenario['clienteA']['grupo'], 'private.acesso_suporte.cadastrar');

    $token = autenticar($cenario['clienteA']['usuario']);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/acessos-suporte', [
            'usuario_admin_id' => $cenario['admin']->id,
        ])
        ->assertStatus(422);
});

test('admin sem acesso de suporte não consegue listar empresas do contexto private', function () {
    $cenario = criarCenarioAcessoSuporte();

    $token = autenticar($cenario['admin']);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/empresas')
        ->assertStatus(403);
});

test('admin com acesso de suporte válido só enxerga a empresa da entidade autorizada', function () {
    $cenario = criarCenarioAcessoSuporte();

    $acesso = criarAcessoAtivo($cenario);

    $token = autenticar($cenario['admin']);

    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->withHeader('X-Acesso-Suporte-Id', $acesso->id)
        ->getJson('/api/empresas');

    $response->assertStatus(200);

    $nomes = collect($response->json('data'))->pluck('nome_fantasia')->all();

    expect($nomes)->toContain('Empresa a');
    expect($nomes)->not->toContain('Empresa b');
});

test('escopo não pode ser alterado por query string mesmo em modo de suporte', function () {
    $cenario = criarCenarioAcessoSuporte();

    $acesso = criarAcessoAtivo($cenario);

    $token = autenticar($cenario['admin']);

    // Tenta forçar, via query string, o grupo_empresa_id do outro cliente.
    $response = $this->withHeader('Authorization', "Bearer {$token}")
        ->withHeader('X-Acesso-Suporte-Id', $acesso->id)
        ->getJson('/api/empresas?grupo_empresa_id=' . $cenario['clienteB']['grupoEmpresa']->id);

    $response->assertStatus(200);

    // O escopo real (entidade_id do acesso) é aplicado em conjunto com o
    // filtro da query string — como eles nunca coincidem, o resultado é
    // sempre vazio, nunca os dados do cliente B.
    expect($response->json('data'))->toBeEmpty();
});

test('acesso de suporte expirado é rejeitado mesmo com status ainda ativo no banco', function () {
    $cenario = criarCenarioAcessoSuporte();

    $acesso = criarAcessoAtivo($cenario, ['expira_em' => now()->subMinute()]);

    $token = autenticar($cenario['admin']);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->withHeader('X-Acesso-Suporte-Id', $acesso->id)
        ->getJson('/api/empresas')
        ->assertStatus(403);

    expect($acesso->fresh()->status)->toBe(AcessoSuporteStatus::EXPIRADO);
});

test('acesso de suporte revogado pelo cliente é rejeitado imediatamente', function () {
    $cenario = criarCenarioAcessoSuporte();

    $acesso = criarAcessoAtivo($cenario, [
        'status' => AcessoSuporteStatus::REVOGADO,
        'encerrado_em' => now(),
        'encerrado_por' => AcessoSuporteEncerradoPor::CLIENTE,
    ]);

    $token = autenticar($cenario['admin']);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->withHeader('X-Acesso-Suporte-Id', $acesso->id)
        ->getJson('/api/empresas')
        ->assertStatus(403);
});

test('cliente consegue revogar um acesso concedido', function () {
    $cenario = criarCenarioAcessoSuporte();

    concederPermissao($cenario['clienteA']['grupo'], 'private.acesso_suporte.revogar');

    $acesso = criarAcessoAtivo($cenario);

    $token = autenticar($cenario['clienteA']['usuario']);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->deleteJson("/api/acessos-suporte/{$acesso->id}")
        ->assertStatus(204);

    expect($acesso->fresh()->status)->toBe(AcessoSuporteStatus::REVOGADO);
    expect($acesso->fresh()->encerrado_por)->toBe(AcessoSuporteEncerradoPor::CLIENTE);
});

test('admin não consegue usar um acesso de suporte concedido a outro admin', function () {
    $cenario = criarCenarioAcessoSuporte();

    $outroAdmin = Usuario::create([
        'grupo_id' => $cenario['admin']->grupo_id,
        'nome' => 'Outro Admin',
        'email' => 'outro.admin@exemplo.com',
        'senha' => bcrypt('Senha123@'),
        'status' => UsuarioStatus::ATIVO->value,
    ]);

    $acesso = criarAcessoAtivo($cenario, ['usuario_admin_id' => $outroAdmin->id]);

    $token = autenticar($cenario['admin']);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->withHeader('X-Acesso-Suporte-Id', $acesso->id)
        ->getJson('/api/empresas')
        ->assertStatus(403);
});

test('o mesmo admin pode possuir acessos de suporte ativos para grupos empresa diferentes', function () {
    $cenario = criarCenarioAcessoSuporte();

    concederPermissao($cenario['clienteA']['grupo'], 'private.acesso_suporte.cadastrar');
    concederPermissao($cenario['clienteB']['grupo'], 'private.acesso_suporte.cadastrar');

    $tokenClienteA = autenticar($cenario['clienteA']['usuario']);

    $this->withHeader('Authorization', "Bearer {$tokenClienteA}")
        ->postJson('/api/acessos-suporte', [
            'usuario_admin_id' => $cenario['admin']->id,
            'duracao_minutos' => 30,
        ])
        ->assertStatus(201);

    $tokenClienteB = autenticar($cenario['clienteB']['usuario']);

    $this->withHeader('Authorization', "Bearer {$tokenClienteB}")
        ->postJson('/api/acessos-suporte', [
            'usuario_admin_id' => $cenario['admin']->id,
            'duracao_minutos' => 30,
        ])
        ->assertStatus(201);

    expect(
        AcessoSuporte::where('usuario_admin_id', $cenario['admin']->id)
            ->where('status', AcessoSuporteStatus::ATIVO)
            ->count()
    )->toBe(2);
});

test('não é possível conceder um segundo acesso ativo para o mesmo admin/entidade', function () {
    $cenario = criarCenarioAcessoSuporte();

    criarAcessoAtivo($cenario);

    concederPermissao($cenario['clienteA']['grupo'], 'private.acesso_suporte.cadastrar');

    $token = autenticar($cenario['clienteA']['usuario']);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/acessos-suporte', [
            'usuario_admin_id' => $cenario['admin']->id,
            'duracao_minutos' => 30,
        ])
        ->assertStatus(400);
});

test('encerrar o acesso pelo admin bloqueia requisições seguintes com o mesmo id', function () {
    $cenario = criarCenarioAcessoSuporte();

    concederPermissao($cenario['admin']->grupo, 'admin.acesso_suporte.encerrar');

    $acesso = criarAcessoAtivo($cenario);

    $token = autenticar($cenario['admin']);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->withHeader('X-Acesso-Suporte-Id', $acesso->id)
        ->deleteJson("/api/admin/acessos-suporte/{$acesso->id}")
        ->assertStatus(204);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->withHeader('X-Acesso-Suporte-Id', $acesso->id)
        ->getJson('/api/empresas')
        ->assertStatus(403);

    expect($acesso->fresh()->encerrado_por)->toBe(AcessoSuporteEncerradoPor::ADMIN);
});

test('auditoria registra o admin real e o acesso de suporte utilizado, sem trocar a identidade', function () {
    $cenario = criarCenarioAcessoSuporte();

    $acesso = criarAcessoAtivo($cenario);

    $token = autenticar($cenario['admin']);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->withHeader('X-Acesso-Suporte-Id', $acesso->id)
        ->putJson("/api/empresas/{$cenario['clienteA']['empresa']->id}", [
            'nome_fantasia' => 'Empresa a Atualizada',
            'razao_social' => $cenario['clienteA']['empresa']->razao_social,
            'uf' => 'SP',
        ]);

    $auditoria = Auditoria::where('entidade_tabela', 'empresas')
        ->where('entidade_id', $cenario['clienteA']['empresa']->id)
        ->latest('criado_em')
        ->first();

    expect($auditoria)->not->toBeNull();
    // usuario_id é sempre o Admin real — Auth::id() nunca foi trocado.
    expect($auditoria->usuario_id)->toBe($cenario['admin']->id);
    expect($auditoria->acesso_suporte_id)->toBe($acesso->id);
});

test('comando agendado expira acessos ativos vencidos e gera auditoria da mudança de status', function () {
    $cenario = criarCenarioAcessoSuporte();

    // Vencido há 5 minutos, mas nunca foi revalidado por nenhuma
    // requisição (X-Acesso-Suporte-Id) — sem o comando agendado, ficaria
    // com status=ATIVO gravado no banco para sempre.
    $acessoVencido = criarAcessoAtivo($cenario, [
        'expira_em' => now()->subMinutes(5),
    ]);

    // Ainda dentro do prazo — não deve ser tocado pelo comando.
    $acessoDentroDoPrazo = criarAcessoAtivo($cenario, [
        'entidade_id' => $cenario['clienteB']['grupoEmpresa']->id,
        'usuario_concedente_id' => $cenario['clienteB']['usuario']->id,
        'expira_em' => now()->addMinutes(30),
    ]);

    $this->artisan('acesso-suporte:expirar-vencidos')->assertExitCode(0);

    expect($acessoVencido->fresh()->status)->toBe(AcessoSuporteStatus::EXPIRADO);
    expect($acessoVencido->fresh()->encerrado_por)->toBe(AcessoSuporteEncerradoPor::EXPIRACAO);
    expect($acessoVencido->fresh()->encerrado_em)->not->toBeNull();

    // O que ainda está dentro do prazo permanece intocado.
    expect($acessoDentroDoPrazo->fresh()->status)->toBe(AcessoSuporteStatus::ATIVO);
    expect($acessoDentroDoPrazo->fresh()->encerrado_em)->toBeNull();

    $auditoria = Auditoria::where('entidade_tabela', 'acessos_suporte')
        ->where('entidade_id', $acessoVencido->id)
        ->where('acao', 'atualizacao')
        ->latest('criado_em')
        ->first();

    expect($auditoria)->not->toBeNull();
    // Expiração automática é feita pelo sistema (comando agendado, sem um
    // Admin autenticado usando o acesso), então não há um acesso_suporte_id
    // "em uso" no momento — diferente da auditoria de uma Empresa alterada
    // durante uma sessão de suporte (testada em outro cenário acima).
    expect($auditoria->acesso_suporte_id)->toBeNull();
    expect($auditoria->campos_alterados)->toContain('status');

    // Rodar de novo não deve re-expirar nem re-auditar o que já está EXPIRADO.
    $this->artisan('acesso-suporte:expirar-vencidos')->assertExitCode(0);

    $totalAuditorias = Auditoria::where('entidade_tabela', 'acessos_suporte')
        ->where('entidade_id', $acessoVencido->id)
        ->where('acao', 'atualizacao')
        ->count();

    expect($totalAuditorias)->toBe(1);
});

test('a mesma estrutura de AcessoSuporte funciona para uma entidade concedente diferente de private', function () {
    $cenario = criarCenarioAcessoSuporte();

    // Simula uma futura entidade "despachante", sem criar nenhuma classe,
    // Service ou Middleware novo — só um novo EntidadeTipo.
    $entidadeTipoDespachante = EntidadeTipo::create([
        'chave' => 'despachante',
        'entidade_tabela' => 'grupo_empresas',
    ]);

    $acesso = criarAcessoAtivo($cenario, [
        'entidade_tipo_id' => $entidadeTipoDespachante->id,
    ]);

    $acesso->load('entidadeTipo');

    app(AcessoSuporteContexto::class)->ativar($acesso);

    // O Gate::before libera dinamicamente o namespace 'despachante.*'...
    expect(Gate::forUser($cenario['admin'])->allows('despachante.qualquer_recurso.listar'))->toBeTrue();

    // ...mas continua sem liberar 'private.*', mesmo com um acesso ativo,
    // porque o acesso concedido é do namespace 'despachante', não 'private'.
    expect(Gate::forUser($cenario['admin'])->allows('private.qualquer_recurso.listar'))->toBeFalse();
});
