<?php

/**
 * Caracteriza o comportamento de GrupoService: CRUD, listagem, sincronização de
 * permissões e — principalmente — o isolamento entre empresas (tenants). Rodam antes e
 * depois da introdução do GrupoRepository para provar que nada mudou.
 */

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tymon\JWTAuth\Facades\JWTAuth;

use App\Enums\UsuarioStatus;
use App\Models\EntidadeTipo;
use App\Models\Grupo;
use App\Models\GrupoEmpresa;
use App\Models\Permissao;
use App\Models\Usuario;
use App\Models\UsuarioSessao;

uses(RefreshDatabase::class);

function permitirGr(Grupo $grupo, string ...$chaves): void
{
    foreach ($chaves as $chave) {
        $p = Permissao::firstOrCreate(['chave' => $chave], ['descricao' => $chave]);
        $grupo->permissoes()->syncWithoutDetaching([$p->id]);
    }
}

function tokenGr(Usuario $usuario): string
{
    $sessao = UsuarioSessao::create(['usuario_id' => $usuario->id, 'ativo' => true, 'ultimo_acesso_em' => now()]);

    return JWTAuth::claims(['session_id' => $sessao->id])->fromUser($usuario);
}

function cenarioGr(): array
{
    $tipoAdmin = EntidadeTipo::create(['chave' => 'admin', 'entidade_tabela' => null]);
    $tipoPrivate = EntidadeTipo::create(['chave' => 'private', 'entidade_tabela' => 'grupo_empresas']);

    $privadas = [];
    foreach (['A', 'B'] as $s) {
        $empresa = GrupoEmpresa::create(['nome' => "Empresa {$s}"]);
        $grupo = Grupo::create(['descricao' => "Gestores {$s}", 'entidade_tipo_id' => $tipoPrivate->id, 'entidade_id' => $empresa->id]);
        $usuario = Usuario::create([
            'grupo_id' => $grupo->id, 'nome' => "Gestor {$s}", 'email' => "gestor.gr.{$s}@exemplo.com",
            'senha' => bcrypt('Senha123@'), 'status' => UsuarioStatus::ATIVO->value,
        ]);
        permitirGr($grupo, 'private.grupo.cadastrar', 'private.grupo.atualizar', 'private.grupo.visualizar',
            'private.grupo.excluir', 'private.grupo.ativar', 'private.grupo.listar', 'private.grupo.sincronizar_permissao');

        $privadas[$s] = ['empresa' => $empresa, 'grupo' => $grupo, 'usuario' => $usuario, 'auth' => tokenGr($usuario)];
    }

    $grupoAdmin = Grupo::create(['descricao' => 'Dev', 'entidade_tipo_id' => $tipoAdmin->id, 'entidade_id' => null]);
    $admin = Usuario::create([
        'grupo_id' => $grupoAdmin->id, 'nome' => 'Admin', 'email' => 'admin.gr@exemplo.com',
        'senha' => bcrypt('Senha123@'), 'status' => UsuarioStatus::ATIVO->value,
    ]);
    permitirGr($grupoAdmin, 'admin.grupo.cadastrar', 'admin.grupo.listar', 'admin.grupo.visualizar');

    return ['tipoAdmin' => $tipoAdmin, 'tipoPrivate' => $tipoPrivate, 'A' => $privadas['A'], 'B' => $privadas['B'],
        'grupoAdmin' => $grupoAdmin, 'admin' => $admin, 'adminAuth' => tokenGr($admin)];
}

function comoGr(array $contexto)
{
    return test()->withHeader('Authorization', 'Bearer ' . $contexto['auth']);
}

function grupoDeGr(array $c, string $quem, string $descricao): Grupo
{
    return Grupo::create([
        'descricao' => $descricao,
        'entidade_tipo_id' => $c['tipoPrivate']->id,
        'entidade_id' => $c[$quem]['empresa']->id,
    ]);
}

// ---------------------------------------------------------------------------------------
// Cadastro
// ---------------------------------------------------------------------------------------

test('o grupo cadastrado nasce na entidade do usuário autenticado', function () {
    $c = cenarioGr();

    $r = comoGr($c['A'])->postJson('/api/grupos', ['descricao' => 'Financeiro'])->assertStatus(201);

    $grupo = Grupo::find($r->json('data.id'));
    expect($grupo->entidade_tipo_id)->toBe($c['tipoPrivate']->id);
    expect($grupo->entidade_id)->toBe($c['A']['empresa']->id);
});

test('não permite descrição repetida na mesma empresa, mas permite em outra', function () {
    $c = cenarioGr();
    grupoDeGr($c, 'A', 'Financeiro');

    comoGr($c['A'])->postJson('/api/grupos', ['descricao' => 'Financeiro'])
        ->assertStatus(400)
        ->assertJsonPath('errors.business.0', 'Já existe um grupo com essa descrição.');

    comoGr($c['B'])->postJson('/api/grupos', ['descricao' => 'Financeiro'])->assertStatus(201);
});

test('o admin cadastra grupo no contexto admin (entidade nula)', function () {
    $c = cenarioGr();

    $r = test()->withHeader('Authorization', 'Bearer ' . $c['adminAuth'])
        ->postJson('/api/admin/grupos', ['descricao' => 'Suporte'])->assertStatus(201);

    $grupo = Grupo::find($r->json('data.id'));
    expect($grupo->entidade_tipo_id)->toBe($c['tipoAdmin']->id);
    expect($grupo->entidade_id)->toBeNull();
});

// ---------------------------------------------------------------------------------------
// Atualização
// ---------------------------------------------------------------------------------------

test('atualiza o próprio grupo e valida duplicidade só quando a descrição muda', function () {
    $c = cenarioGr();
    $g1 = grupoDeGr($c, 'A', 'Vendas');
    grupoDeGr($c, 'A', 'Compras');

    comoGr($c['A'])->putJson("/api/grupos/{$g1->id}", ['descricao' => 'Vendas Sul'])->assertOk();
    expect($g1->fresh()->descricao)->toBe('Vendas Sul');

    // Mesma descrição do próprio grupo não conta como duplicada.
    comoGr($c['A'])->putJson("/api/grupos/{$g1->id}", ['descricao' => 'Vendas Sul'])->assertOk();

    comoGr($c['A'])->putJson("/api/grupos/{$g1->id}", ['descricao' => 'Compras'])
        ->assertStatus(400)
        ->assertJsonPath('errors.business.0', 'Já existe um grupo com essa descrição.');
});

test('empresa A não atualiza, visualiza, exclui nem reativa grupo da empresa B', function () {
    $c = cenarioGr();
    $gB = grupoDeGr($c, 'B', 'Interno B');

    comoGr($c['A'])->putJson("/api/grupos/{$gB->id}", ['descricao' => 'Invadido'])
        ->assertStatus(400)->assertJsonPath('errors.business.0', 'Grupo não encontrado.');

    comoGr($c['A'])->getJson("/api/grupos/{$gB->id}")
        ->assertStatus(400)->assertJsonPath('errors.business.0', 'Grupo não encontrado.');

    comoGr($c['A'])->deleteJson("/api/grupos/{$gB->id}")
        ->assertStatus(400)->assertJsonPath('errors.business.0', 'Grupo não encontrado para exclusão.');
    expect($gB->fresh()->trashed())->toBeFalse();

    $gB->delete();
    comoGr($c['A'])->patchJson("/api/grupos/{$gB->id}/ativar")
        ->assertStatus(400)->assertJsonPath('errors.business.0', 'Grupo não encontrado para ativação.');
    expect($gB->fresh()->trashed())->toBeTrue();

    expect($gB->fresh()->descricao)->toBe('Interno B');
});

// ---------------------------------------------------------------------------------------
// Visualização, exclusão e reativação
// ---------------------------------------------------------------------------------------

test('visualiza o próprio grupo com as permissões', function () {
    $c = cenarioGr();

    $r = comoGr($c['A'])->getJson("/api/grupos/{$c['A']['grupo']->id}")->assertOk();

    expect(collect($r->json('data.permissoes'))->pluck('chave')->all())->toContain('private.grupo.listar');
});

test('exclui (soft delete) e reativa o próprio grupo', function () {
    $c = cenarioGr();
    $g = grupoDeGr($c, 'A', 'Temporário');

    comoGr($c['A'])->deleteJson("/api/grupos/{$g->id}")->assertStatus(204);
    expect($g->fresh()->trashed())->toBeTrue();

    // Um grupo excluído não é visualizável nem excluível de novo.
    comoGr($c['A'])->getJson("/api/grupos/{$g->id}")->assertStatus(400);
    comoGr($c['A'])->deleteJson("/api/grupos/{$g->id}")->assertStatus(400);

    comoGr($c['A'])->patchJson("/api/grupos/{$g->id}/ativar")->assertOk();
    expect($g->fresh()->trashed())->toBeFalse();

    // Reativar um grupo que não está excluído não encontra nada.
    comoGr($c['A'])->patchJson("/api/grupos/{$g->id}/ativar")->assertStatus(400);
});

// ---------------------------------------------------------------------------------------
// Listagem
// ---------------------------------------------------------------------------------------

test('a listagem traz só os grupos da própria empresa, mais recentes primeiro', function () {
    $c = cenarioGr();
    // created_at explícito: a listagem ordena por ele e criações no mesmo segundo empatam.
    grupoDeGr($c, 'A', 'Alfa')->forceFill(['created_at' => now()->addMinute()])->saveQuietly();
    grupoDeGr($c, 'B', 'Beta de B');

    $r = comoGr($c['A'])->getJson('/api/grupos')->assertOk();
    $descricoes = collect($r->json('data'))->pluck('descricao')->all();

    expect($descricoes)->toContain('Alfa', 'Gestores A')
        ->not->toContain('Beta de B', 'Gestores B');

    expect($descricoes[0])->toBe('Alfa');
});

test('a listagem filtra por descrição e por id, e só inclui excluídos quando pedido', function () {
    $c = cenarioGr();
    $g = grupoDeGr($c, 'A', 'Logistica');
    grupoDeGr($c, 'A', 'Financeiro');
    $g->delete();

    $semExcluidos = comoGr($c['A'])->getJson('/api/grupos?descricao=logis')->assertOk();
    expect($semExcluidos->json('data'))->toBeEmpty();

    $comExcluidos = comoGr($c['A'])->getJson('/api/grupos?descricao=logis&excluido=1')->assertOk();
    expect(collect($comExcluidos->json('data'))->pluck('id')->all())->toBe([$g->id]);

    $porId = comoGr($c['A'])->getJson("/api/grupos?id={$c['A']['grupo']->id}")->assertOk();
    expect($porId->json('data'))->toHaveCount(1);
});

test('filtrar pelo id de um grupo da empresa B não vaza dados', function () {
    $c = cenarioGr();

    $r = comoGr($c['A'])->getJson("/api/grupos?id={$c['B']['grupo']->id}")->assertOk();

    expect($r->json('data'))->toBeEmpty();
});

test('a listagem do admin traz só grupos do contexto admin', function () {
    $c = cenarioGr();

    $r = test()->withHeader('Authorization', 'Bearer ' . $c['adminAuth'])->getJson('/api/admin/grupos')->assertOk();
    $descricoes = collect($r->json('data'))->pluck('descricao')->all();

    expect($descricoes)->toBe(['Dev']);
});

// ---------------------------------------------------------------------------------------
// Sincronização de permissões
// ---------------------------------------------------------------------------------------

test('sincroniza as permissões do próprio grupo e incrementa a versão', function () {
    $c = cenarioGr();
    $g = grupoDeGr($c, 'A', 'Operação');
    $p = Permissao::firstOrCreate(['chave' => 'private.usuario.listar'], ['descricao' => 'x']);
    $versaoAntes = $g->fresh()->versao;

    // O incremento de `versao` acontece no touch(), que só grava se updated_at mudar
    // (precisão de segundos) — por isso o relógio avança.
    test()->travel(5)->seconds();

    $r = comoGr($c['A'])->patchJson("/api/grupos/{$g->id}/permissoes", ['permissoes' => [$p->id]])->assertOk();

    expect(collect($r->json('data.permissoes'))->pluck('chave')->all())->toBe(['private.usuario.listar']);
    expect($g->fresh()->versao)->toBeGreaterThan($versaoAntes);
});

test('não sincroniza permissões de outro tipo nem de grupo de outra empresa', function () {
    $c = cenarioGr();
    $gB = grupoDeGr($c, 'B', 'Operação B');
    $gA = grupoDeGr($c, 'A', 'Operação A');
    $privada = Permissao::firstOrCreate(['chave' => 'private.usuario.listar'], ['descricao' => 'x']);
    $admin = Permissao::firstOrCreate(['chave' => 'admin.usuario.listar'], ['descricao' => 'x']);

    comoGr($c['A'])->patchJson("/api/grupos/{$gA->id}/permissoes", ['permissoes' => [$admin->id]])
        ->assertStatus(400)
        ->assertJsonPath('errors.business.0', 'Existem permissões incompatíveis com o tipo do grupo.');

    $resposta = comoGr($c['A'])->patchJson("/api/grupos/{$gB->id}/permissoes", ['permissoes' => [$privada->id]]);
    expect($resposta->status())->toBeIn([400, 404]);
    expect($gB->fresh()->permissoes()->count())->toBe(0);
});
