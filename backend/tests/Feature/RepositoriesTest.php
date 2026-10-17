<?php

/**
 * Integração de EscopoEntidadeService::atual(), GrupoRepository e UsuarioRepository direto no
 * banco: cada método com escopo é provado contra uma "empresa vizinha" (isolamento).
 */

use Illuminate\Foundation\Testing\RefreshDatabase;

use App\AcessoSuporte\AcessoSuporteContexto;
use App\DTO\Common\PaginationDTO;
use App\DTO\Grupo\GrupoFiltroDTO;
use App\DTO\Usuario\UsuarioFiltroDTO;
use App\Enums\EntidadeTipo as EntidadeTipoEnum;
use App\Models\AcessoSuporte;
use App\Models\EntidadeTipo;
use App\Models\Grupo;
use App\Models\GrupoEmpresa;
use App\Models\Usuario;
use App\Repositories\GrupoRepository;
use App\Repositories\UsuarioRepository;
use App\Services\EscopoEntidadeService;
use App\Support\EscopoEntidade;

uses(RefreshDatabase::class);

function cenarioRepo(): array
{
    $admin = EntidadeTipo::create(['chave' => 'admin', 'entidade_tabela' => null]);
    $private = EntidadeTipo::create(['chave' => 'private', 'entidade_tabela' => 'grupo_empresas']);

    $mk = function (string $s) use ($private) {
        $ge = GrupoEmpresa::create(['nome' => "Empresa {$s}"]);
        $g = Grupo::create(['descricao' => "G {$s}", 'entidade_tipo_id' => $private->id, 'entidade_id' => $ge->id]);
        $u = Usuario::create(['grupo_id' => $g->id, 'nome' => "U {$s}", 'email' => "u.{$s}.repo@exemplo.com", 'senha' => bcrypt('x'), 'status' => 'ativo']);

        return ['ge' => $ge, 'grupo' => $g, 'usuario' => $u, 'escopo' => new EscopoEntidade($private->id, $ge->id)];
    };

    $gAdmin = Grupo::create(['descricao' => 'G admin', 'entidade_tipo_id' => $admin->id, 'entidade_id' => null]);
    $uAdmin = Usuario::create(['grupo_id' => $gAdmin->id, 'nome' => 'U admin', 'email' => 'u.admin.repo@exemplo.com', 'senha' => bcrypt('x'), 'status' => 'ativo']);

    return ['A' => $mk('A'), 'B' => $mk('B'), 'tipoAdmin' => $admin, 'tipoPrivate' => $private,
        'gAdmin' => $gAdmin, 'uAdmin' => $uAdmin, 'escopoAdmin' => new EscopoEntidade($admin->id, null)];
}

function filtroGrupo(array $dados = []): GrupoFiltroDTO
{
    return GrupoFiltroDTO::criarParaFiltro($dados);
}

function filtroUsuario(array $dados = []): UsuarioFiltroDTO
{
    return UsuarioFiltroDTO::criarParaFiltro($dados);
}

// ---------------------------------------------------------------------------------------
// EscopoEntidadeService::atual()
// ---------------------------------------------------------------------------------------

test('atual() devolve o escopo do grupo do usuário autenticado', function () {
    $c = cenarioRepo();

    test()->actingAs($c['A']['usuario']);

    $escopo = app(EscopoEntidadeService::class)->atual();

    expect($escopo->entidadeTipoId)->toBe($c['tipoPrivate']->id);
    expect($escopo->entidadeId)->toBe($c['A']['ge']->id);
});

test('atual() do admin é o escopo admin, com entidade nula (nunca "sem escopo")', function () {
    $c = cenarioRepo();

    test()->actingAs($c['uAdmin']);

    $escopo = app(EscopoEntidadeService::class)->atual();

    expect($escopo->entidadeTipoId)->toBe($c['tipoAdmin']->id);
    expect($escopo->entidadeId)->toBeNull();
});

test('atual() em modo de suporte devolve o escopo do cliente impersonado, não o do admin', function () {
    $c = cenarioRepo();
    test()->actingAs($c['uAdmin']);

    app(AcessoSuporteContexto::class)->ativar(new AcessoSuporte([
        'entidade_tipo_id' => $c['tipoPrivate']->id,
        'entidade_id' => $c['B']['ge']->id,
    ]));

    $escopo = app(EscopoEntidadeService::class)->atual();

    expect($escopo->entidadeTipoId)->toBe($c['tipoPrivate']->id);
    expect($escopo->entidadeId)->toBe($c['B']['ge']->id);
});

test('atual() sem usuário autenticado falha em vez de liberar tudo', function () {
    cenarioRepo();

    app(EscopoEntidadeService::class)->atual();
})->throws(LogicException::class);

// ---------------------------------------------------------------------------------------
// GrupoRepository
// ---------------------------------------------------------------------------------------

test('GrupoRepository: toda leitura é escopada e uma empresa nunca enxerga a outra', function () {
    $c = cenarioRepo();
    $repo = new GrupoRepository();
    $gA = $c['A']['grupo'];
    $gB = $c['B']['grupo'];
    $eA = $c['A']['escopo'];

    expect($repo->buscarNoEscopo($eA, $gA->id)?->id)->toBe($gA->id);
    expect($repo->buscarNoEscopo($eA, $gB->id))->toBeNull();
    expect($repo->buscarNoEscopo($c['escopoAdmin'], $gA->id))->toBeNull();

    expect($repo->buscarComPermissoesNoEscopo($eA, $gA->id)?->relationLoaded('permissoes'))->toBeTrue();
    expect($repo->buscarComPermissoesNoEscopo($eA, $gB->id))->toBeNull();

    expect($repo->buscarComPermissoesNoEscopoOuFalhar($eA, $gA->id)->id)->toBe($gA->id);
    expect(fn () => $repo->buscarComPermissoesNoEscopoOuFalhar($eA, $gB->id))
        ->toThrow(Illuminate\Database\Eloquent\ModelNotFoundException::class);

    $gB->delete();
    expect($repo->buscarExcluidoNoEscopo($c['B']['escopo'], $gB->id)?->id)->toBe($gB->id);
    expect($repo->buscarExcluidoNoEscopo($eA, $gB->id))->toBeNull();
    expect($repo->buscarExcluidoNoEscopo($eA, $gA->id))->toBeNull();
});

test('GrupoRepository::existeComDescricaoNoEscopo respeita o escopo e o id ignorado', function () {
    $c = cenarioRepo();
    $repo = new GrupoRepository();

    expect($repo->existeComDescricaoNoEscopo($c['A']['escopo'], 'G A'))->toBeTrue();
    expect($repo->existeComDescricaoNoEscopo($c['A']['escopo'], 'G B'))->toBeFalse();   // existe, mas na outra empresa
    expect($repo->existeComDescricaoNoEscopo($c['A']['escopo'], 'G A', $c['A']['grupo']->id))->toBeFalse();
});

test('GrupoRepository::listarNoEscopo só traz o escopo, filtra e pagina', function () {
    $c = cenarioRepo();
    $repo = new GrupoRepository();
    Grupo::create(['descricao' => 'Extra A', 'entidade_tipo_id' => $c['tipoPrivate']->id, 'entidade_id' => $c['A']['ge']->id]);
    $morto = Grupo::create(['descricao' => 'Morto A', 'entidade_tipo_id' => $c['tipoPrivate']->id, 'entidade_id' => $c['A']['ge']->id]);
    $morto->delete();

    $todos = $repo->listarNoEscopo($c['A']['escopo'], filtroGrupo());
    expect($todos->pluck('descricao')->all())->toEqualCanonicalizing(['G A', 'Extra A']);

    expect($repo->listarNoEscopo($c['A']['escopo'], filtroGrupo(['excluido' => true]))->pluck('descricao')->all())->toContain('Morto A');
    expect($repo->listarNoEscopo($c['A']['escopo'], filtroGrupo(['descricao' => 'extra']))->pluck('descricao')->all())->toBe(['Extra A']);
    expect($repo->listarNoEscopo($c['A']['escopo'], filtroGrupo(['id' => $c['B']['grupo']->id]))->total())->toBe(0);
    expect($repo->listarNoEscopo($c['A']['escopo'], filtroGrupo(['por_pagina' => 1]))->perPage())->toBe(1);
});

test('GrupoRepository::criarNoEscopo grava o escopo informado', function () {
    $c = cenarioRepo();
    $repo = new GrupoRepository();

    $g = $repo->criarNoEscopo($c['B']['escopo'], 'Novo B');
    expect($g->fresh()->entidade_id)->toBe($c['B']['ge']->id);
    expect($g->fresh()->entidade_tipo_id)->toBe($c['tipoPrivate']->id);

    $a = $repo->criarNoEscopo($c['escopoAdmin'], 'Novo admin');
    expect($a->fresh()->entidade_id)->toBeNull();
    expect($a->fresh()->entidade_tipo_id)->toBe($c['tipoAdmin']->id);
});

// ---------------------------------------------------------------------------------------
// UsuarioRepository
// ---------------------------------------------------------------------------------------

test('UsuarioRepository: leituras escopadas não alcançam a empresa vizinha', function () {
    $c = cenarioRepo();
    $repo = new UsuarioRepository();
    $uA = $c['A']['usuario'];
    $uB = $c['B']['usuario'];
    $eA = $c['A']['escopo'];

    expect($repo->buscarNoEscopo($eA, $uA->id)?->id)->toBe($uA->id);
    expect($repo->buscarNoEscopo($eA, $uB->id))->toBeNull();
    expect($repo->buscarNoEscopo($c['escopoAdmin'], $uA->id))->toBeNull();

    expect($repo->buscarComGrupoNoEscopo($eA, $uA->id)?->relationLoaded('grupo'))->toBeTrue();
    expect($repo->buscarComGrupoNoEscopo($eA, $uB->id))->toBeNull();

    expect($repo->buscarComGrupoExcluidoNoEscopo($eA, $uB->id))->toBeNull();

    $uB->delete();
    expect($repo->buscarExcluidoNoEscopo($eA, $uB->id))->toBeNull();
    expect($repo->buscarExcluidoNoEscopo($c['B']['escopo'], $uB->id)?->id)->toBe($uB->id);
});

test('UsuarioRepository: grupo excluído só é visto por quem o método diz', function () {
    $c = cenarioRepo();
    $repo = new UsuarioRepository();
    $eA = $c['A']['escopo'];
    $c['A']['grupo']->delete();

    expect($repo->buscarNoEscopo($eA, $c['A']['usuario']->id))->toBeNull();
    expect($repo->buscarComGrupoNoEscopo($eA, $c['A']['usuario']->id))->toBeNull();
    expect($repo->buscarComGrupoExcluidoNoEscopo($eA, $c['A']['usuario']->id)?->id)->toBe($c['A']['usuario']->id);
    expect($repo->listarNoEscopo($eA, filtroUsuario())->pluck('id')->all())->toBe([$c['A']['usuario']->id]);
});

test('UsuarioRepository::listarNoEscopo filtra, pagina e carrega o grupo (sem N+1)', function () {
    $c = cenarioRepo();
    $repo = new UsuarioRepository();
    foreach (range(1, 3) as $i) {
        Usuario::create(['grupo_id' => $c['A']['grupo']->id, 'nome' => "Maria {$i}", 'email' => "maria{$i}.repo@exemplo.com", 'senha' => bcrypt('x'), 'status' => 'ativo']);
    }

    $pagina = $repo->listarNoEscopo($c['A']['escopo'], filtroUsuario(['nome' => 'maria', 'por_pagina' => 2]));

    expect($pagina->total())->toBe(3)->and($pagina->perPage())->toBe(2);
    expect($repo->listarNoEscopo($c['A']['escopo'], filtroUsuario(['grupo_id' => $c['B']['grupo']->id]))->total())->toBe(0);

    DB::enableQueryLog();
    $pagina->each(fn ($u) => $u->grupoComExcluidos?->descricao);
    expect(DB::getQueryLog())->toBeEmpty();
});

test('UsuarioRepository::criarNoGrupo cria no grupo já validado', function () {
    $c = cenarioRepo();

    $u = (new UsuarioRepository())->criarNoGrupo($c['B']['grupo'], ['nome' => 'Novo', 'email' => 'novo.repo@exemplo.com', 'status' => 'convidado']);

    expect($u->fresh()->grupo_id)->toBe($c['B']['grupo']->id);
    expect($u->fresh()->status->value)->toBe('convidado');
});

test('UsuarioRepository: lookups de autenticação, cliente do grupo e administradores', function () {
    $c = cenarioRepo();
    $repo = new UsuarioRepository();

    expect($repo->buscarAtivoPorEmail('u.A.repo@exemplo.com', EntidadeTipoEnum::PRIVATE)?->id)->toBe($c['A']['usuario']->id);
    expect($repo->buscarAtivoPorEmail('u.A.repo@exemplo.com', EntidadeTipoEnum::ADMIN))->toBeNull();
    expect($repo->buscarAtivoPorId($c['uAdmin']->id, EntidadeTipoEnum::ADMIN)?->id)->toBe($c['uAdmin']->id);
    expect($repo->buscarAtivoOuConvidadoPorEmail('u.admin.repo@exemplo.com', EntidadeTipoEnum::ADMIN)?->id)->toBe($c['uAdmin']->id);

    expect($repo->buscarClienteDoGrupo($c['A']['usuario']->id, $c['A']['grupo']->id)?->id)->toBe($c['A']['usuario']->id);
    expect($repo->buscarClienteDoGrupo($c['A']['usuario']->id, $c['B']['grupo']->id))->toBeNull();       // grupo errado
    expect($repo->buscarClienteDoGrupo($c['uAdmin']->id, $c['gAdmin']->id))->toBeNull();                  // grupo admin

    expect($repo->listarAdministradoresComPermissao(null, ['permissao.que.nao.existe']))->toBeEmpty();
});

test('UsuarioRepository::buscarAdministradorAtivoPorId só devolve administrador ATIVO de grupo Admin não excluído', function () {
    $c = cenarioRepo();
    $repo = app(UsuarioRepository::class);

    expect($repo->buscarAdministradorAtivoPorId($c['uAdmin']->id)?->id)->toBe($c['uAdmin']->id);
    expect($repo->buscarAdministradorAtivoPorId($c['uAdmin']->id)?->relationLoaded('grupo'))->toBeTrue();
    expect($repo->buscarAdministradorAtivoPorId($c['A']['usuario']->id))->toBeNull();                   // usuário de cliente
    expect($repo->buscarAdministradorAtivoPorId((string) \Illuminate\Support\Str::uuid()))->toBeNull();  // inexistente

    foreach (['bloqueado', 'inativo', 'convidado', 'expirado'] as $status) {
        $c['uAdmin']->update(['status' => $status]);
        expect($repo->buscarAdministradorAtivoPorId($c['uAdmin']->id))->toBeNull("status {$status} não pode receber concessão");
    }

    $c['uAdmin']->update(['status' => 'ativo']);
    expect($repo->buscarAdministradorAtivoPorId($c['uAdmin']->id))->not->toBeNull();

    $c['gAdmin']->delete();
    expect($repo->buscarAdministradorAtivoPorId($c['uAdmin']->id))->toBeNull();                         // grupo excluído
});

test('UsuarioRepository::pesquisarEmTodasAsEntidades é global, filtra por nome e limita as colunas', function () {
    $c = cenarioRepo();
    $repo = app(UsuarioRepository::class);

    $todos = $repo->pesquisarEmTodasAsEntidades(\App\DTO\Mensagem\MensagemBuscaUsuarioFiltroDTO::criarParaFiltro([]));
    expect(collect($todos->items())->pluck('nome')->all())->toEqualCanonicalizing(['U A', 'U admin', 'U B']);   // ordem depende da collation do banco
    expect(array_keys($todos->items()[0]->getAttributes()))->toBe(['id', 'nome', 'email']);

    $filtrado = $repo->pesquisarEmTodasAsEntidades(\App\DTO\Mensagem\MensagemBuscaUsuarioFiltroDTO::criarParaFiltro(['nome' => 'u b']));
    expect(collect($filtrado->items())->pluck('nome')->all())->toBe(['U B']);
});
