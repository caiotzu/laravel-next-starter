<?php

/**
 * Caracteriza as consultas de UsuarioService que dependem de entidade/contexto: grupos
 * excluídos, listagem, lookups de autenticação, esqueci-minha-senha e lista de
 * administradores. Complementa UsuarioTest/EscopoEntidadeTest e roda antes/depois da
 * introdução do UsuarioRepository.
 */

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tymon\JWTAuth\Facades\JWTAuth;

use App\Enums\EntidadeTipo as EntidadeTipoEnum;
use App\Enums\UsuarioStatus;
use App\Events\UsuarioEsqueceuSenha;
use App\Models\EntidadeTipo;
use App\Models\Grupo;
use App\Models\GrupoEmpresa;
use App\Models\Permissao;
use App\Models\Usuario;
use App\Models\UsuarioSessao;
use App\Services\UsuarioService;

uses(RefreshDatabase::class);

function usuarioEs(Grupo $grupo, string $email, string $status = 'ativo', string $nome = 'Fulano'): Usuario
{
    return Usuario::create([
        'grupo_id' => $grupo->id, 'nome' => $nome, 'email' => $email,
        'senha' => bcrypt('Senha123@'), 'status' => $status,
    ]);
}

function tokenEs(Usuario $u): string
{
    $s = UsuarioSessao::create(['usuario_id' => $u->id, 'ativo' => true, 'ultimo_acesso_em' => now()]);

    return JWTAuth::claims(['session_id' => $s->id])->fromUser($u);
}

function cenarioEs(): array
{
    $tipoAdmin = EntidadeTipo::create(['chave' => 'admin', 'entidade_tabela' => null]);
    $tipoPrivate = EntidadeTipo::create(['chave' => 'private', 'entidade_tabela' => 'grupo_empresas']);

    $emp = [];
    foreach (['A', 'B'] as $s) {
        $ge = GrupoEmpresa::create(['nome' => "Empresa {$s}"]);
        $g = Grupo::create(['descricao' => "Grupo {$s}", 'entidade_tipo_id' => $tipoPrivate->id, 'entidade_id' => $ge->id]);
        $gestor = usuarioEs($g, "gestor.es.{$s}@exemplo.com", 'ativo', "Gestor {$s}");
        foreach (['cadastrar', 'atualizar', 'visualizar', 'excluir', 'ativar', 'listar'] as $acao) {
            $p = Permissao::firstOrCreate(['chave' => "private.usuario.{$acao}"], ['descricao' => $acao]);
            $g->permissoes()->syncWithoutDetaching([$p->id]);
        }
        $emp[$s] = ['ge' => $ge, 'grupo' => $g, 'gestor' => $gestor, 'auth' => tokenEs($gestor)];
    }

    $grupoAdmin = Grupo::create(['descricao' => 'Dev', 'entidade_tipo_id' => $tipoAdmin->id, 'entidade_id' => null]);

    return ['tipoAdmin' => $tipoAdmin, 'tipoPrivate' => $tipoPrivate, 'A' => $emp['A'], 'B' => $emp['B'], 'grupoAdmin' => $grupoAdmin];
}

function comoEs(array $ctx)
{
    return test()->withHeader('Authorization', 'Bearer ' . $ctx['auth']);
}

// ---------------------------------------------------------------------------------------
// Grupo excluído: cada operação trata de um jeito (e isso precisa continuar igual)
// ---------------------------------------------------------------------------------------

test('usuário de grupo excluído: aparece na listagem, mas não é visualizável nem atualizável', function () {
    $c = cenarioEs();
    $outroGrupo = Grupo::create(['descricao' => 'Antigo', 'entidade_tipo_id' => $c['tipoPrivate']->id, 'entidade_id' => $c['A']['ge']->id]);
    $u = usuarioEs($outroGrupo, 'orfao@exemplo.com', 'ativo', 'Órfão');
    $outroGrupo->delete();

    $lista = comoEs($c['A'])->getJson('/api/usuarios')->assertOk();
    expect(collect($lista->json('data'))->pluck('id')->all())->toContain($u->id);

    comoEs($c['A'])->getJson("/api/usuarios/{$u->id}")->assertStatus(400);

    comoEs($c['A'])->putJson("/api/usuarios/{$u->id}", ['grupo_id' => $c['A']['grupo']->id, 'nome' => 'Novo', 'email' => 'orfao@exemplo.com'])
        ->assertStatus(400);
    expect($u->fresh()->nome)->toBe('Órfão');
});

test('usuário de grupo excluído pode ser excluído e reativado normalmente', function () {
    $c = cenarioEs();
    $g = Grupo::create(['descricao' => 'Antigo', 'entidade_tipo_id' => $c['tipoPrivate']->id, 'entidade_id' => $c['A']['ge']->id]);
    $u = usuarioEs($g, 'orfao2@exemplo.com');
    $g->delete();

    comoEs($c['A'])->deleteJson("/api/usuarios/{$u->id}")->assertStatus(204);
    expect($u->fresh()->trashed())->toBeTrue();

    comoEs($c['A'])->patchJson("/api/usuarios/{$u->id}/ativar")->assertOk();
    expect($u->fresh()->trashed())->toBeFalse();
});

test('não cadastra usuário em grupo excluído', function () {
    $c = cenarioEs();
    $g = Grupo::create(['descricao' => 'Antigo', 'entidade_tipo_id' => $c['tipoPrivate']->id, 'entidade_id' => $c['A']['ge']->id]);
    $g->delete();

    comoEs($c['A'])->postJson('/api/usuarios', ['grupo_id' => $g->id, 'nome' => 'X', 'email' => 'x.es@exemplo.com'])
        ->assertStatus(400)
        ->assertJsonPath('errors.business.0', 'O grupo selecionado não é válido para este cadastro.');
});

// ---------------------------------------------------------------------------------------
// Exclusão/ativação entre empresas: uma única consulta escopada, sem vazar existência
// ---------------------------------------------------------------------------------------

test('usuário de outra empresa é indistinguível de inexistente ao excluir (sem oráculo de existência)', function () {
    $c = cenarioEs();
    $uB = usuarioEs($c['B']['grupo'], 'b.del.es@exemplo.com');

    $mensagens = [];
    foreach ([$uB->id, '0198a1b2-0000-7000-8000-000000000000'] as $id) {
        $mensagens[] = comoEs($c['A'])->deleteJson("/api/usuarios/{$id}")
            ->assertStatus(400)->json('errors.business.0');
    }

    expect($mensagens)->toBe(['Usuário não encontrado para exclusão.', 'Usuário não encontrado para exclusão.']);
    expect($uB->fresh()->trashed())->toBeFalse();
});

test('usuário de outra empresa é indistinguível de inexistente ao ativar (sem oráculo de existência)', function () {
    $c = cenarioEs();
    $uB = usuarioEs($c['B']['grupo'], 'b.ativ.es@exemplo.com');
    $uB->delete();

    $mensagens = [];
    foreach ([$uB->id, '0198a1b2-0000-7000-8000-000000000000'] as $id) {
        $mensagens[] = comoEs($c['A'])->patchJson("/api/usuarios/{$id}/ativar")
            ->assertStatus(400)->json('errors.business.0');
    }

    expect($mensagens)->toBe(['Usuário não encontrado para ativação.', 'Usuário não encontrado para ativação.']);
    expect($uB->fresh()->trashed())->toBeTrue();
});

// ---------------------------------------------------------------------------------------
// Listagem
// ---------------------------------------------------------------------------------------

test('a listagem filtra por nome, grupo e id, e só inclui excluídos quando pedido', function () {
    $c = cenarioEs();
    $x = usuarioEs($c['A']['grupo'], 'maria.es@exemplo.com', 'ativo', 'Maria Souza');
    $y = usuarioEs($c['A']['grupo'], 'jose.es@exemplo.com', 'ativo', 'José Lima');
    $y->delete();

    $ids = fn ($r) => collect($r->json('data'))->pluck('id')->all();

    expect($ids(comoEs($c['A'])->getJson('/api/usuarios?nome=maria')))->toBe([$x->id]);
    expect($ids(comoEs($c['A'])->getJson('/api/usuarios?nome=jos')))->toBe([]);
    expect($ids(comoEs($c['A'])->getJson('/api/usuarios?nome=jos&excluido=1')))->toBe([$y->id]);
    expect($ids(comoEs($c['A'])->getJson("/api/usuarios?id={$x->id}")))->toBe([$x->id]);
    expect($ids(comoEs($c['A'])->getJson("/api/usuarios?grupo_id={$c['A']['grupo']->id}")))->toContain($x->id);
});

test('a listagem vem ordenada do mais recente para o mais antigo', function () {
    $c = cenarioEs();
    $antigo = usuarioEs($c['A']['grupo'], 'antigo.es@exemplo.com');
    $novo = usuarioEs($c['A']['grupo'], 'novo.es@exemplo.com');
    $antigo->forceFill(['created_at' => now()->subDay()])->saveQuietly();
    $novo->forceFill(['created_at' => now()->addDay()])->saveQuietly();

    $ids = collect(comoEs($c['A'])->getJson('/api/usuarios')->json('data'))->pluck('id')->all();

    expect($ids[0])->toBe($novo->id);
    expect(array_search($antigo->id, $ids))->toBeGreaterThan(array_search($c['A']['gestor']->id, $ids) - 1);
});

// ---------------------------------------------------------------------------------------
// Lookups de autenticação (login / refresh / esqueci minha senha)
// ---------------------------------------------------------------------------------------

test('obterUsuarioAtivoPorEmail respeita status e o tipo de entidade', function () {
    $c = cenarioEs();
    $service = app(UsuarioService::class);
    usuarioEs($c['A']['grupo'], 'convidado.es@exemplo.com', 'convidado');
    usuarioEs($c['A']['grupo'], 'bloq.es@exemplo.com', 'bloqueado');
    $admin = usuarioEs($c['grupoAdmin'], 'adm.es@exemplo.com');

    expect($service->obterUsuarioAtivoPorEmail('gestor.es.A@exemplo.com', EntidadeTipoEnum::PRIVATE)?->id)->toBe($c['A']['gestor']->id);
    expect($service->obterUsuarioAtivoPorEmail('convidado.es@exemplo.com', EntidadeTipoEnum::PRIVATE))->toBeNull();
    expect($service->obterUsuarioAtivoPorEmail('bloq.es@exemplo.com', EntidadeTipoEnum::PRIVATE))->toBeNull();
    expect($service->obterUsuarioAtivoPorEmail('gestor.es.A@exemplo.com', EntidadeTipoEnum::ADMIN))->toBeNull();
    expect($service->obterUsuarioAtivoPorEmail('adm.es@exemplo.com', EntidadeTipoEnum::ADMIN)?->id)->toBe($admin->id);
    expect($service->obterUsuarioAtivoPorEmail('adm.es@exemplo.com', EntidadeTipoEnum::PRIVATE))->toBeNull();
});

test('obterUsuarioAtivoPorEmail traz grupo, tipo e grupo-empresa carregados', function () {
    $c = cenarioEs();

    $u = app(UsuarioService::class)->obterUsuarioAtivoPorEmail('gestor.es.A@exemplo.com', EntidadeTipoEnum::PRIVATE);

    expect($u->relationLoaded('grupo'))->toBeTrue();
    expect($u->grupo->relationLoaded('entidadeTipo'))->toBeTrue();
    expect($u->grupo->relationLoaded('grupoEmpresa'))->toBeTrue();
});

test('login de cliente é recusado quando o grupo-empresa do grupo foi excluído', function () {
    $c = cenarioEs();
    $c['A']['ge']->delete();

    expect(app(UsuarioService::class)->obterUsuarioAtivoPorEmail('gestor.es.A@exemplo.com', EntidadeTipoEnum::PRIVATE))->toBeNull();
    // Por id (refresh/2FA) não faz essa checagem: comportamento atual.
    expect(app(UsuarioService::class)->obterUsuarioAtivoPorId($c['A']['gestor']->id, EntidadeTipoEnum::PRIVATE))->not->toBeNull();
});

test('obterUsuarioAtivoPorId só devolve ativos do tipo pedido', function () {
    $c = cenarioEs();
    $service = app(UsuarioService::class);
    $conv = usuarioEs($c['A']['grupo'], 'conv2.es@exemplo.com', 'convidado');

    expect($service->obterUsuarioAtivoPorId($c['A']['gestor']->id, EntidadeTipoEnum::PRIVATE))->not->toBeNull();
    expect($service->obterUsuarioAtivoPorId($c['A']['gestor']->id, EntidadeTipoEnum::ADMIN))->toBeNull();
    expect($service->obterUsuarioAtivoPorId($conv->id, EntidadeTipoEnum::PRIVATE))->toBeNull();
});

test('esqueceuSenha dispara o evento só para ativos e convidados do tipo informado', function () {
    $c = cenarioEs();
    Event::fake([UsuarioEsqueceuSenha::class]);
    $service = app(UsuarioService::class);
    usuarioEs($c['A']['grupo'], 'conv3.es@exemplo.com', 'convidado');
    usuarioEs($c['A']['grupo'], 'bloq3.es@exemplo.com', 'bloqueado');

    $service->esqueceuSenha('gestor.es.A@exemplo.com', EntidadeTipoEnum::PRIVATE);
    $service->esqueceuSenha('conv3.es@exemplo.com', EntidadeTipoEnum::PRIVATE);
    Event::assertDispatchedTimes(UsuarioEsqueceuSenha::class, 2);

    $service->esqueceuSenha('bloq3.es@exemplo.com', EntidadeTipoEnum::PRIVATE);
    $service->esqueceuSenha('gestor.es.A@exemplo.com', EntidadeTipoEnum::ADMIN);
    $service->esqueceuSenha('nao.existe@exemplo.com', EntidadeTipoEnum::PRIVATE);
    Event::assertDispatchedTimes(UsuarioEsqueceuSenha::class, 2);
});

// ---------------------------------------------------------------------------------------
// Administradores com acesso de suporte
// ---------------------------------------------------------------------------------------

test('lista só administradores ativos cujo grupo tem a permissão, ordenados por nome, com busca', function () {
    $c = cenarioEs();
    $perm = Permissao::firstOrCreate(['chave' => 'admin.acesso_suporte.listar'], ['descricao' => 'x']);
    $c['grupoAdmin']->permissoes()->sync([$perm->id]);
    $semPerm = Grupo::create(['descricao' => 'Sem', 'entidade_tipo_id' => $c['tipoAdmin']->id, 'entidade_id' => null]);

    usuarioEs($c['grupoAdmin'], 'zeca.es@exemplo.com', 'ativo', 'Zeca');
    usuarioEs($c['grupoAdmin'], 'ana.es@exemplo.com', 'ativo', 'Ana');
    usuarioEs($c['grupoAdmin'], 'bloq.adm.es@exemplo.com', 'bloqueado', 'Bruno');
    usuarioEs($semPerm, 'semperm.es@exemplo.com', 'ativo', 'Carlos');

    $service = app(UsuarioService::class);

    expect($service->listarAdministradoresComAcessoSuporte(null)->pluck('nome')->all())->toBe(['Ana', 'Zeca']);
    expect($service->listarAdministradoresComAcessoSuporte('ZEC')->pluck('nome')->all())->toBe(['Zeca']);
    expect($service->listarAdministradoresComAcessoSuporte('ana.es@')->pluck('nome')->all())->toBe(['Ana']);
});

// ---------------------------------------------------------------------------------------
// Escopo do admin
// ---------------------------------------------------------------------------------------

test('a listagem de usuários do admin traz só usuários do contexto admin', function () {
    $c = cenarioEs();
    $admin = usuarioEs($c['grupoAdmin'], 'adm2.es@exemplo.com', 'ativo', 'Admin 2');
    $p = Permissao::firstOrCreate(['chave' => 'admin.usuario.listar'], ['descricao' => 'x']);
    $c['grupoAdmin']->permissoes()->syncWithoutDetaching([$p->id]);

    $r = test()->withHeader('Authorization', 'Bearer ' . tokenEs($admin))->getJson('/api/admin/usuarios')->assertOk();
    $emails = collect($r->json('data'))->pluck('email')->all();

    expect($emails)->toContain('adm2.es@exemplo.com')
        ->not->toContain('gestor.es.A@exemplo.com', 'gestor.es.B@exemplo.com');
});
