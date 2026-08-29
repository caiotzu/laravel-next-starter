<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;

use Tymon\JWTAuth\Facades\JWTAuth;

use App\Models\Usuario;
use App\Models\Grupo;
use App\Models\EntidadeTipo;
use App\Models\UsuarioSessao;
use App\Models\Permissao;
use App\Models\Chamado;
use App\Models\Mensagem;

use App\Enums\UsuarioStatus;
use App\Enums\ChamadoStatus;

uses(RefreshDatabase::class);

function autenticarUsuarioChamado(Usuario $usuario): string
{
    $sessao = UsuarioSessao::create([
        'usuario_id' => $usuario->id,
        'ativo' => true,
        'ultimo_acesso_em' => now(),
    ]);

    return JWTAuth::claims(['session_id' => $sessao->id])->fromUser($usuario);
}

function concederPermissaoChamado(Grupo $grupo, string $chave): void
{
    $permissao = Permissao::firstOrCreate(
        ['chave' => $chave],
        ['descricao' => $chave]
    );

    $grupo->permissoes()->syncWithoutDetaching([$permissao->id]);
}

/**
 * Um Admin com a permissão de atender chamados, e dois clientes Private
 * distintos (para provar isolamento entre eles).
 */
function criarCenarioChamado(): array
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
        'nome' => 'Admin Suporte',
        'email' => 'admin.chamado@exemplo.com',
        'senha' => bcrypt('Senha123@'),
        'status' => UsuarioStatus::ATIVO->value,
    ]);

    concederPermissaoChamado($grupoAdmin, 'admin.chamado.atender');

    $criarCliente = function (string $sufixo) use ($entidadeTipoPrivate) {
        $grupo = Grupo::create([
            'descricao' => 'Administrador',
            'entidade_tipo_id' => $entidadeTipoPrivate->id,
            'entidade_id' => null,
        ]);

        $usuario = Usuario::create([
            'grupo_id' => $grupo->id,
            'nome' => "Cliente {$sufixo}",
            'email' => "cliente.chamado.{$sufixo}@exemplo.com",
            'senha' => bcrypt('Senha123@'),
            'status' => UsuarioStatus::ATIVO->value,
        ]);

        concederPermissaoChamado($grupo, 'private.chamado.listar');
        concederPermissaoChamado($grupo, 'private.chamado.abrir');
        concederPermissaoChamado($grupo, 'private.chamado.responder');

        return ['grupo' => $grupo, 'usuario' => $usuario];
    };

    return [
        'grupoAdmin' => $grupoAdmin,
        'admin' => $admin,
        'clienteA' => $criarCliente('a'),
        'clienteB' => $criarCliente('b'),
    ];
}

test('cliente consegue abrir um chamado e recebe um ticket único', function () {
    $cenario = criarCenarioChamado();
    $token = autenticarUsuarioChamado($cenario['clienteA']['usuario']);

    $resposta = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/chamados', [
            'tipo' => 'duvida',
            'assunto' => 'Não consigo acessar um relatório',
            'mensagem' => '<p>Preciso de ajuda para acessar o relatório mensal.</p>',
        ])
        ->assertStatus(201);

    $resposta->assertJsonPath('data.status', 'aberto');
    expect($resposta->json('data.ticket'))->toMatch('/^SUP-\d{4}-\d{6}$/');
});

test('assunto e mensagem são obrigatórios para abrir um chamado', function () {
    $cenario = criarCenarioChamado();
    $token = autenticarUsuarioChamado($cenario['clienteA']['usuario']);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/chamados', ['tipo' => 'duvida'])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['assunto', 'mensagem']);
});

test('anexo com extensão não permitida é rejeitado', function () {
    Storage::fake('public');

    $cenario = criarCenarioChamado();
    $token = autenticarUsuarioChamado($cenario['clienteA']['usuario']);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/chamados', [
            'tipo' => 'duvida',
            'assunto' => 'Teste de anexo inválido',
            'mensagem' => '<p>Mensagem</p>',
            'anexos' => [[
                'nome' => 'arquivo.exe',
                'conteudo' => base64_encode('MZ' . str_repeat('X', 100)), // binário arbitrário, não é PDF/JPG/PNG
            ]],
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['anexos.0.conteudo']);
});

test('anexo acima do limite de tamanho é rejeitado', function () {
    Storage::fake('public');
    config(['api.chamados.anexo_tamanho_maximo_kb' => 1]); // 1KB

    $cenario = criarCenarioChamado();
    $token = autenticarUsuarioChamado($cenario['clienteA']['usuario']);

    $conteudoGrande = "%PDF-1.4\n" . str_repeat('0', 5000); // > 1KB

    $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/chamados', [
            'tipo' => 'duvida',
            'assunto' => 'Teste de anexo grande',
            'mensagem' => '<p>Mensagem</p>',
            'anexos' => [[
                'nome' => 'documento.pdf',
                'conteudo' => base64_encode($conteudoGrande),
            ]],
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['anexos.0.conteudo']);
});

test('anexo válido é aceito e fica vinculado à mensagem', function () {
    Storage::fake('public');

    $cenario = criarCenarioChamado();
    $token = autenticarUsuarioChamado($cenario['clienteA']['usuario']);

    $conteudoPdf = "%PDF-1.4\n%âãÏÓ\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>";

    $resposta = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/chamados', [
            'tipo' => 'duvida',
            'assunto' => 'Teste de anexo válido',
            'mensagem' => '<p>Segue documento em anexo.</p>',
            'anexos' => [[
                'nome' => 'documento.pdf',
                'conteudo' => base64_encode($conteudoPdf),
            ]],
        ])
        ->assertStatus(201);

    $anexos = $resposta->json('data.mensagens.0.anexos');
    expect($anexos)->toHaveCount(1);
    expect($anexos[0]['nome_original'])->toBe('documento.pdf');

    $chamado = Chamado::first();
    Storage::disk('public')->assertExists(
        $chamado->mensagens()->first()->anexos()->first()->caminho
    );
});

test('cliente não consegue visualizar chamado de outro cliente', function () {
    $cenario = criarCenarioChamado();

    $tokenA = autenticarUsuarioChamado($cenario['clienteA']['usuario']);
    $chamado = $this->withHeader('Authorization', "Bearer {$tokenA}")
        ->postJson('/api/chamados', [
            'tipo' => 'duvida',
            'assunto' => 'Chamado do cliente A',
            'mensagem' => '<p>Mensagem do cliente A.</p>',
        ])->json('data');

    $tokenB = autenticarUsuarioChamado($cenario['clienteB']['usuario']);

    $this->withHeader('Authorization', "Bearer {$tokenB}")
        ->getJson("/api/chamados/{$chamado['id']}")
        ->assertStatus(404);

    $this->withHeader('Authorization', "Bearer {$tokenB}")
        ->postJson("/api/chamados/{$chamado['id']}/mensagens", ['mensagem' => '<p>Tentativa indevida</p>'])
        ->assertStatus(404);
});

test('usuário sem permissão não consegue acessar a listagem de chamados', function () {
    $cenario = criarCenarioChamado();

    // Usuário Private sem NENHUMA permissão de chamado concedida.
    $entidadeTipoPrivate = EntidadeTipo::where('chave', 'private')->first();
    $grupoSemPermissao = Grupo::create([
        'descricao' => 'Sem permissão',
        'entidade_tipo_id' => $entidadeTipoPrivate->id,
        'entidade_id' => null,
    ]);
    $usuarioSemPermissao = Usuario::create([
        'grupo_id' => $grupoSemPermissao->id,
        'nome' => 'Sem Permissão',
        'email' => 'sem.permissao.chamado@exemplo.com',
        'senha' => bcrypt('Senha123@'),
        'status' => UsuarioStatus::ATIVO->value,
    ]);

    $token = autenticarUsuarioChamado($usuarioSemPermissao);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/chamados')
        ->assertStatus(403);
});

test('abertura de chamado notifica todo ADMIN com a permissão de atender', function () {
    $cenario = criarCenarioChamado();
    $token = autenticarUsuarioChamado($cenario['clienteA']['usuario']);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/chamados', [
            'tipo' => 'duvida',
            'assunto' => 'Preciso de ajuda',
            'mensagem' => '<p>Mensagem inicial.</p>',
        ])
        ->assertStatus(201);

    $mensagemSistema = Mensagem::where('origem', 'sistema')->latest('created_at')->first();

    expect($mensagemSistema)->not->toBeNull();

    $destinatarios = $mensagemSistema->destinatarios()->pluck('usuario_id')->all();
    expect($destinatarios)->toContain($cenario['admin']->id);
});

test('suporte consegue responder e o cliente é notificado', function () {
    $cenario = criarCenarioChamado();

    $tokenCliente = autenticarUsuarioChamado($cenario['clienteA']['usuario']);
    $chamado = $this->withHeader('Authorization', "Bearer {$tokenCliente}")
        ->postJson('/api/chamados', [
            'tipo' => 'duvida',
            'assunto' => 'Dúvida sobre faturamento',
            'mensagem' => '<p>Como funciona a cobrança?</p>',
        ])->json('data');

    concederPermissaoChamado($cenario['grupoAdmin'], 'admin.chamado.responder');
    concederPermissaoChamado($cenario['grupoAdmin'], 'admin.chamado.listar');
    $tokenAdmin = autenticarUsuarioChamado($cenario['admin']);

    $this->withHeader('Authorization', "Bearer {$tokenAdmin}")
        ->postJson("/api/admin/chamados/{$chamado['id']}/mensagens", [
            'mensagem' => '<p>Olá! Vamos te ajudar com isso.</p>',
        ])
        ->assertStatus(201);

    $chamadoAtualizado = Chamado::find($chamado['id']);
    expect($chamadoAtualizado->status)->toBe(ChamadoStatus::AGUARDANDO_CLIENTE);
    expect($chamadoAtualizado->primeira_resposta_em)->not->toBeNull();

    $notificacaoCliente = Mensagem::where('origem', 'sistema')
        ->where('titulo', 'like', 'Nova resposta%')
        ->where('titulo', 'like', "%{$chamadoAtualizado->ticket}%")
        ->latest('created_at')
        ->first();

    expect($notificacaoCliente)->not->toBeNull();
    $destinatarios = $notificacaoCliente->destinatarios()->pluck('usuario_id')->all();
    expect($destinatarios)->toContain($cenario['clienteA']['usuario']->id);
});

test('chamado encerrado não aceita novas respostas', function () {
    $cenario = criarCenarioChamado();

    $tokenCliente = autenticarUsuarioChamado($cenario['clienteA']['usuario']);
    $chamado = $this->withHeader('Authorization', "Bearer {$tokenCliente}")
        ->postJson('/api/chamados', [
            'tipo' => 'duvida',
            'assunto' => 'Chamado a ser encerrado',
            'mensagem' => '<p>Mensagem inicial.</p>',
        ])->json('data');

    concederPermissaoChamado($cenario['grupoAdmin'], 'admin.chamado.gerenciar');
    $tokenAdmin = autenticarUsuarioChamado($cenario['admin']);

    $this->withHeader('Authorization', "Bearer {$tokenAdmin}")
        ->patchJson("/api/admin/chamados/{$chamado['id']}/status", ['status' => 'fechado'])
        ->assertStatus(200)
        ->assertJsonPath('data.status', 'fechado');

    expect(Chamado::find($chamado['id'])->fechado_em)->not->toBeNull();

    $this->withHeader('Authorization', "Bearer {$tokenCliente}")
        ->postJson("/api/chamados/{$chamado['id']}/mensagens", ['mensagem' => '<p>Tentando responder</p>'])
        ->assertStatus(400);
});

test('chamado resolvido também bloqueia novas mensagens, mas não registra fechado_em', function () {
    $cenario = criarCenarioChamado();

    $tokenCliente = autenticarUsuarioChamado($cenario['clienteA']['usuario']);
    $chamado = $this->withHeader('Authorization', "Bearer {$tokenCliente}")
        ->postJson('/api/chamados', [
            'tipo' => 'duvida',
            'assunto' => 'Chamado a ser resolvido',
            'mensagem' => '<p>Mensagem inicial.</p>',
        ])->json('data');

    concederPermissaoChamado($cenario['grupoAdmin'], 'admin.chamado.gerenciar');
    $tokenAdmin = autenticarUsuarioChamado($cenario['admin']);

    $this->withHeader('Authorization', "Bearer {$tokenAdmin}")
        ->patchJson("/api/admin/chamados/{$chamado['id']}/status", ['status' => 'resolvido'])
        ->assertStatus(200)
        ->assertJsonPath('data.status', 'resolvido');

    // Resolvido não é a mesma coisa que fechado — fechado_em permanece nulo.
    expect(Chamado::find($chamado['id'])->fechado_em)->toBeNull();

    $this->withHeader('Authorization', "Bearer {$tokenCliente}")
        ->postJson("/api/chamados/{$chamado['id']}/mensagens", ['mensagem' => '<p>Tentando responder</p>'])
        ->assertStatus(400);
});

test('admin consegue definir e alterar a prioridade do chamado', function () {
    $cenario = criarCenarioChamado();

    $tokenCliente = autenticarUsuarioChamado($cenario['clienteA']['usuario']);
    $chamado = $this->withHeader('Authorization', "Bearer {$tokenCliente}")
        ->postJson('/api/chamados', [
            'tipo' => 'duvida',
            'assunto' => 'Chamado de teste de prioridade',
            'mensagem' => '<p>Mensagem inicial.</p>',
        ])->json('data');

    concederPermissaoChamado($cenario['grupoAdmin'], 'admin.chamado.gerenciar');
    concederPermissaoChamado($cenario['grupoAdmin'], 'admin.chamado.listar');
    $tokenAdmin = autenticarUsuarioChamado($cenario['admin']);

    $this->withHeader('Authorization', "Bearer {$tokenAdmin}")
        ->patchJson("/api/admin/chamados/{$chamado['id']}/prioridade", ['prioridade' => 'urgente'])
        ->assertStatus(200)
        ->assertJsonPath('data.prioridade', 'urgente');

    expect(Chamado::find($chamado['id'])->prioridade)->toBe(\App\Enums\ChamadoPrioridade::URGENTE);

    // Persiste corretamente ao recarregar/visualizar novamente.
    $this->withHeader('Authorization', "Bearer {$tokenAdmin}")
        ->getJson("/api/admin/chamados/{$chamado['id']}")
        ->assertJsonPath('data.prioridade', 'urgente');
});

test('usuário sem permissão de gerenciar não consegue alterar prioridade nem responsável', function () {
    $cenario = criarCenarioChamado();

    $tokenCliente = autenticarUsuarioChamado($cenario['clienteA']['usuario']);
    $chamado = $this->withHeader('Authorization', "Bearer {$tokenCliente}")
        ->postJson('/api/chamados', [
            'tipo' => 'duvida',
            'assunto' => 'Chamado sem permissão de gerenciar',
            'mensagem' => '<p>Mensagem inicial.</p>',
        ])->json('data');

    // Admin SEM admin.chamado.gerenciar concedida.
    $tokenAdmin = autenticarUsuarioChamado($cenario['admin']);

    $this->withHeader('Authorization', "Bearer {$tokenAdmin}")
        ->patchJson("/api/admin/chamados/{$chamado['id']}/prioridade", ['prioridade' => 'alta'])
        ->assertStatus(403);

    $this->withHeader('Authorization', "Bearer {$tokenAdmin}")
        ->patchJson("/api/admin/chamados/{$chamado['id']}/responsavel", ['responsavel_id' => $cenario['admin']->id])
        ->assertStatus(403);
});

test('admin consegue definir e alterar o responsável do chamado', function () {
    $cenario = criarCenarioChamado();

    $tokenCliente = autenticarUsuarioChamado($cenario['clienteA']['usuario']);
    $chamado = $this->withHeader('Authorization', "Bearer {$tokenCliente}")
        ->postJson('/api/chamados', [
            'tipo' => 'duvida',
            'assunto' => 'Chamado de teste de responsável',
            'mensagem' => '<p>Mensagem inicial.</p>',
        ])->json('data');

    concederPermissaoChamado($cenario['grupoAdmin'], 'admin.chamado.gerenciar');
    $tokenAdmin = autenticarUsuarioChamado($cenario['admin']);

    $this->withHeader('Authorization', "Bearer {$tokenAdmin}")
        ->patchJson("/api/admin/chamados/{$chamado['id']}/responsavel", ['responsavel_id' => $cenario['admin']->id])
        ->assertStatus(200)
        ->assertJsonPath('data.responsavel.id', $cenario['admin']->id);

    expect(Chamado::find($chamado['id'])->responsavel_id)->toBe($cenario['admin']->id);

    // Remove o responsável (null é uma transição válida).
    $this->withHeader('Authorization', "Bearer {$tokenAdmin}")
        ->patchJson("/api/admin/chamados/{$chamado['id']}/responsavel", ['responsavel_id' => null])
        ->assertStatus(200)
        ->assertJsonPath('data.responsavel', null);

    expect(Chamado::find($chamado['id'])->responsavel_id)->toBeNull();
});

test('listagem de chamados é paginada, tanto no Private quanto no Admin', function () {
    $cenario = criarCenarioChamado();
    concederPermissaoChamado($cenario['grupoAdmin'], 'admin.chamado.listar');

    $tokenCliente = autenticarUsuarioChamado($cenario['clienteA']['usuario']);

    for ($i = 0; $i < 3; $i++) {
        $this->withHeader('Authorization', "Bearer {$tokenCliente}")
            ->postJson('/api/chamados', [
                'tipo' => 'duvida',
                'assunto' => "Chamado {$i}",
                'mensagem' => '<p>Mensagem</p>',
            ])->assertStatus(201);
    }

    $this->withHeader('Authorization', "Bearer {$tokenCliente}")
        ->getJson('/api/chamados?por_pagina=2')
        ->assertStatus(200)
        ->assertJsonPath('meta.per_page', 2)
        ->assertJsonPath('meta.total', 3)
        ->assertJsonCount(2, 'data');

    $tokenAdmin = autenticarUsuarioChamado($cenario['admin']);
    $this->withHeader('Authorization', "Bearer {$tokenAdmin}")
        ->getJson('/api/admin/chamados?por_pagina=2')
        ->assertStatus(200)
        ->assertJsonPath('meta.total', 3)
        ->assertJsonCount(2, 'data');
});

test('admin consegue filtrar chamados por prioridade e por responsável', function () {
    $cenario = criarCenarioChamado();
    concederPermissaoChamado($cenario['grupoAdmin'], 'admin.chamado.listar');
    concederPermissaoChamado($cenario['grupoAdmin'], 'admin.chamado.gerenciar');

    $tokenCliente = autenticarUsuarioChamado($cenario['clienteA']['usuario']);
    $tokenAdmin = autenticarUsuarioChamado($cenario['admin']);

    $chamadoUrgente = $this->withHeader('Authorization', "Bearer {$tokenCliente}")
        ->postJson('/api/chamados', [
            'tipo' => 'duvida',
            'assunto' => 'Chamado urgente',
            'mensagem' => '<p>Mensagem</p>',
        ])->json('data');

    $this->withHeader('Authorization', "Bearer {$tokenCliente}")
        ->postJson('/api/chamados', [
            'tipo' => 'duvida',
            'assunto' => 'Chamado normal',
            'mensagem' => '<p>Mensagem</p>',
        ])->assertStatus(201);

    $this->withHeader('Authorization', "Bearer {$tokenAdmin}")
        ->patchJson("/api/admin/chamados/{$chamadoUrgente['id']}/prioridade", ['prioridade' => 'urgente'])
        ->assertStatus(200);

    $this->withHeader('Authorization', "Bearer {$tokenAdmin}")
        ->patchJson("/api/admin/chamados/{$chamadoUrgente['id']}/responsavel", ['responsavel_id' => $cenario['admin']->id])
        ->assertStatus(200);

    $this->withHeader('Authorization', "Bearer {$tokenAdmin}")
        ->getJson('/api/admin/chamados?prioridade=urgente')
        ->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $chamadoUrgente['id']);

    $this->withHeader('Authorization', "Bearer {$tokenAdmin}")
        ->getJson("/api/admin/chamados?responsavel_id={$cenario['admin']->id}")
        ->assertStatus(200)
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $chamadoUrgente['id']);

    // Sem filtro, os dois aparecem.
    $this->withHeader('Authorization', "Bearer {$tokenAdmin}")
        ->getJson('/api/admin/chamados')
        ->assertStatus(200)
        ->assertJsonCount(2, 'data');
});
