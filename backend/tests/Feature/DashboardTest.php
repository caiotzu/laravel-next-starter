<?php

use Illuminate\Foundation\Testing\RefreshDatabase;

use Tymon\JWTAuth\Facades\JWTAuth;

use App\Models\Usuario;
use App\Models\Grupo;
use App\Models\EntidadeTipo;
use App\Models\UsuarioSessao;
use App\Models\Permissao;
use App\Models\Chamado;
use App\Models\Empresa;
use App\Models\GrupoEmpresa;

use App\Enums\UsuarioStatus;
use App\Enums\ChamadoTipo;
use App\Enums\ChamadoStatus;
use App\Enums\ChamadoPrioridade;
use App\Enums\EmpresaStatus;

uses(RefreshDatabase::class);

function autenticarUsuarioDashboard(Usuario $usuario): string
{
    $sessao = UsuarioSessao::create([
        'usuario_id' => $usuario->id,
        'ativo' => true,
        'ultimo_acesso_em' => now(),
    ]);

    return JWTAuth::claims(['session_id' => $sessao->id])->fromUser($usuario);
}

function concederPermissaoDashboard(Grupo $grupo, string $chave): void
{
    $permissao = Permissao::firstOrCreate(['chave' => $chave], ['descricao' => $chave]);
    $grupo->permissoes()->syncWithoutDetaching([$permissao->id]);
}

function criarCenarioDashboard(): array
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
        'nome' => 'Admin Dashboard',
        'email' => 'admin.dashboard@exemplo.com',
        'senha' => bcrypt('Senha123@'),
        'status' => UsuarioStatus::ATIVO->value,
    ]);

    $grupoEmpresa = GrupoEmpresa::create(['nome' => 'Grupo Teste Dashboard']);

    $grupoCliente = Grupo::create([
        'descricao' => 'Administrador',
        'entidade_tipo_id' => $entidadeTipoPrivate->id,
        'entidade_id' => $grupoEmpresa->id,
    ]);

    $cliente = Usuario::create([
        'grupo_id' => $grupoCliente->id,
        'nome' => 'Cliente Dashboard',
        'email' => 'cliente.dashboard@exemplo.com',
        'senha' => bcrypt('Senha123@'),
        'status' => UsuarioStatus::ATIVO->value,
    ]);

    return compact('grupoAdmin', 'admin', 'grupoEmpresa', 'grupoCliente', 'cliente');
}

function criarChamadoDashboard(array $cenario, array $overrides = []): Chamado
{
    static $sequencial = 0;
    $sequencial++;

    return Chamado::create(array_merge([
        'ticket' => sprintf('SUP-TESTE-%06d', $sequencial),
        'usuario_id' => $cenario['cliente']->id,
        'tipo' => ChamadoTipo::DUVIDA,
        'assunto' => 'Chamado de teste',
        'status' => ChamadoStatus::ABERTO,
        'prioridade' => ChamadoPrioridade::NORMAL,
        'aberto_em' => now(),
        'ultima_interacao_em' => now(),
    ], $overrides));
}

test('usuário sem permissão não consegue acessar o dashboard', function () {
    $cenario = criarCenarioDashboard();
    $token = autenticarUsuarioDashboard($cenario['admin']);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/admin/dashboard')
        ->assertStatus(403);
});

test('admin com permissão consegue visualizar os KPIs do dashboard', function () {
    $cenario = criarCenarioDashboard();
    concederPermissaoDashboard($cenario['grupoAdmin'], 'admin.dashboard.visualizar');

    Empresa::create([
        'grupo_empresa_id' => $cenario['grupoEmpresa']->id,
        'cnpj' => '11222333000181',
        'nome_fantasia' => 'Empresa Teste Dashboard 1',
        'razao_social' => 'Empresa Teste Dashboard 1 LTDA',
        'status' => EmpresaStatus::ATIVO,
        'uf' => 'SP',
    ]);
    Empresa::create([
        'grupo_empresa_id' => $cenario['grupoEmpresa']->id,
        'cnpj' => '11222333000262',
        'nome_fantasia' => 'Empresa Teste Dashboard 2',
        'razao_social' => 'Empresa Teste Dashboard 2 LTDA',
        'status' => EmpresaStatus::ATIVO,
        'uf' => 'SP',
    ]);

    criarChamadoDashboard($cenario, ['status' => ChamadoStatus::ABERTO]);
    criarChamadoDashboard($cenario, [
        'status' => ChamadoStatus::FECHADO,
        'aberto_em' => now()->subDays(2),
        'fechado_em' => now()->subDay(),
    ]);

    $token = autenticarUsuarioDashboard($cenario['admin']);

    $resposta = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/admin/dashboard?periodo=ultimos_30_dias')
        ->assertStatus(200);

    $resposta->assertJsonPath('data.kpis.total_empresas', 2);
    $resposta->assertJsonPath('data.kpis.chamados_abertos', 1);
    $resposta->assertJsonPath('data.kpis.chamados_fechados_no_periodo', 1);
    expect($resposta->json('data.evolucao_chamados'))->toBeArray();
    expect($resposta->json('data.tempo_atendimento.resolucao.media_segundos'))->not->toBeNull();
});

test('período personalizado exige data_inicio e data_fim', function () {
    $cenario = criarCenarioDashboard();
    concederPermissaoDashboard($cenario['grupoAdmin'], 'admin.dashboard.visualizar');
    $token = autenticarUsuarioDashboard($cenario['admin']);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/admin/dashboard?periodo=personalizado')
        ->assertStatus(422)
        ->assertJsonValidationErrors(['data_inicio', 'data_fim']);

    $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/admin/dashboard?periodo=personalizado&data_inicio=2026-01-01&data_fim=2026-01-31')
        ->assertStatus(200);
});

test('ranking de responsáveis reflete corretamente quem mais encerrou chamados no período', function () {
    $cenario = criarCenarioDashboard();
    concederPermissaoDashboard($cenario['grupoAdmin'], 'admin.dashboard.visualizar');

    $outroAdmin = Usuario::create([
        'grupo_id' => $cenario['grupoAdmin']->id,
        'nome' => 'Outro Admin',
        'email' => 'outro.admin.dashboard@exemplo.com',
        'senha' => bcrypt('Senha123@'),
        'status' => UsuarioStatus::ATIVO->value,
    ]);

    // Admin principal encerra 2, outro encerra 1 — o ranking deve refletir essa ordem.
    criarChamadoDashboard($cenario, [
        'status' => ChamadoStatus::FECHADO,
        'responsavel_id' => $cenario['admin']->id,
        'aberto_em' => now()->subDays(2),
        'fechado_em' => now()->subDay(),
    ]);
    criarChamadoDashboard($cenario, [
        'status' => ChamadoStatus::FECHADO,
        'responsavel_id' => $cenario['admin']->id,
        'aberto_em' => now()->subDays(2),
        'fechado_em' => now()->subDay(),
    ]);
    criarChamadoDashboard($cenario, [
        'status' => ChamadoStatus::FECHADO,
        'responsavel_id' => $outroAdmin->id,
        'aberto_em' => now()->subDays(2),
        'fechado_em' => now()->subDay(),
    ]);

    $token = autenticarUsuarioDashboard($cenario['admin']);

    $resposta = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/admin/dashboard?periodo=ultimos_30_dias')
        ->assertStatus(200);

    $ranking = $resposta->json('data.ranking_responsaveis');

    expect($ranking)->toHaveCount(2);
    expect($ranking[0]['responsavel_id'])->toBe($cenario['admin']->id);
    expect($ranking[0]['total_encerrados'])->toBe(2);
    expect($ranking[1]['total_encerrados'])->toBe(1);
});

test('chamados sem responsável e chamados mais antigos aparecem corretamente', function () {
    $cenario = criarCenarioDashboard();
    concederPermissaoDashboard($cenario['grupoAdmin'], 'admin.dashboard.visualizar');

    $chamadoAntigo = criarChamadoDashboard($cenario, [
        'status' => ChamadoStatus::ABERTO,
        'aberto_em' => now()->subDays(10),
    ]);
    criarChamadoDashboard($cenario, [
        'status' => ChamadoStatus::ABERTO,
        'aberto_em' => now()->subDay(),
        'responsavel_id' => $cenario['admin']->id,
    ]);

    $token = autenticarUsuarioDashboard($cenario['admin']);

    $resposta = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/admin/dashboard?periodo=ultimos_30_dias')
        ->assertStatus(200);

    // Só o chamado sem responsavel_id deve aparecer aqui.
    expect($resposta->json('data.chamados_sem_responsavel.total'))->toBe(1);
    expect($resposta->json('data.chamados_sem_responsavel.chamados.0.id'))->toBe($chamadoAntigo->id);

    // O mais antigo em aberto deve vir primeiro.
    expect($resposta->json('data.chamados_mais_antigos.0.id'))->toBe($chamadoAntigo->id);
});
