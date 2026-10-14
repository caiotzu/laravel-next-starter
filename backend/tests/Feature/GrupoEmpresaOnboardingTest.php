<?php

/**
 * Caracteriza o onboarding de uma nova empresa (GrupoEmpresaService::cadastrar): empresa +
 * grupo "Administrador" + usuário convidado. Rodam antes e depois de o Service passar a usar
 * GrupoRepository/UsuarioRepository, para provar que o resultado gravado não mudou.
 */

use App\Enums\UsuarioStatus;
use App\Events\UsuarioCriado;
use App\Models\EntidadeTipo;
use App\Models\Grupo;
use App\Models\GrupoEmpresa;
use App\Models\Permissao;
use App\Models\Usuario;
use App\Models\UsuarioSessao;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tymon\JWTAuth\Facades\JWTAuth;

uses(RefreshDatabase::class);

function cenarioOnboarding(bool $comPermissao = true): array
{
    $tipoAdmin = EntidadeTipo::create(['chave' => 'admin', 'entidade_tabela' => null]);
    $tipoPrivate = EntidadeTipo::create(['chave' => 'private', 'entidade_tabela' => 'grupo_empresas']);

    foreach (['private.usuario.listar', 'private.grupo.listar', 'admin.usuario.listar'] as $chave) {
        Permissao::create(['chave' => $chave, 'descricao' => $chave]);
    }

    $grupoAdmin = Grupo::create(['descricao' => 'Dev', 'entidade_tipo_id' => $tipoAdmin->id, 'entidade_id' => null]);
    $admin = Usuario::create([
        'grupo_id' => $grupoAdmin->id, 'nome' => 'Admin', 'email' => 'admin.onboarding@exemplo.com',
        'senha' => bcrypt('Senha123@'), 'status' => UsuarioStatus::ATIVO->value,
    ]);

    if ($comPermissao) {
        $permissao = Permissao::create(['chave' => 'admin.grupo_empresa.cadastrar', 'descricao' => 'Cadastrar empresa']);
        $grupoAdmin->permissoes()->sync([$permissao->id]);
    }

    $sessao = UsuarioSessao::create(['usuario_id' => $admin->id, 'ativo' => true, 'ultimo_acesso_em' => now()]);

    return [
        'tipoPrivate' => $tipoPrivate,
        'auth' => JWTAuth::claims(['session_id' => $sessao->id])->fromUser($admin),
    ];
}

function cadastrarEmpresa(array $contexto, array $dados)
{
    return test()->withHeader('Authorization', 'Bearer '.$contexto['auth'])->postJson('/api/admin/grupos-empresas', $dados);
}

test('cadastra a empresa com o grupo Administrador no escopo dela e um usuário convidado', function () {
    Event::fake([UsuarioCriado::class]);
    $c = cenarioOnboarding();

    cadastrarEmpresa($c, ['nome' => 'Nova Empresa', 'usuario' => ['nome' => 'Dona Maria', 'email' => 'maria@nova.com']])
        ->assertStatus(201);

    $empresa = GrupoEmpresa::where('nome', 'Nova Empresa')->firstOrFail();
    $grupo = Grupo::where('entidade_id', $empresa->id)->firstOrFail();

    expect($grupo->descricao)->toBe('Administrador');
    expect($grupo->entidade_tipo_id)->toBe($c['tipoPrivate']->id);

    $usuario = Usuario::where('email', 'maria@nova.com')->firstOrFail();
    expect($usuario->grupo_id)->toBe($grupo->id);
    expect($usuario->nome)->toBe('Dona Maria');
    expect($usuario->senha)->toBeNull();
    expect($usuario->status)->toBe(UsuarioStatus::CONVIDADO);

    Event::assertDispatched(UsuarioCriado::class, fn (UsuarioCriado $e) => $e->usuario->id === $usuario->id);
});

test('o grupo Administrador recebe somente as permissões private.*', function () {
    Event::fake([UsuarioCriado::class]);
    $c = cenarioOnboarding();

    cadastrarEmpresa($c, ['nome' => 'Outra Empresa', 'usuario' => ['nome' => 'Joao', 'email' => 'joao@outra.com']])
        ->assertStatus(201);

    $grupo = Grupo::where('entidade_id', GrupoEmpresa::where('nome', 'Outra Empresa')->value('id'))->firstOrFail();

    expect($grupo->permissoes()->pluck('chave')->sort()->values()->all())
        ->toBe(['private.grupo.listar', 'private.usuario.listar']);
});

test('retorna 403 e não grava nada quando o admin não tem a permissão de cadastrar', function () {
    $c = cenarioOnboarding(comPermissao: false);

    cadastrarEmpresa($c, ['nome' => 'Sem Permissao', 'usuario' => ['nome' => 'X', 'email' => 'x@sem.com']])
        ->assertStatus(403);

    expect(GrupoEmpresa::where('nome', 'Sem Permissao')->exists())->toBeFalse();
    expect(Usuario::where('email', 'x@sem.com')->exists())->toBeFalse();
});

test('retorna 401 quando a requisição não tem token', function () {
    cenarioOnboarding();

    $this->postJson('/api/admin/grupos-empresas', ['nome' => 'Anonima', 'usuario' => ['nome' => 'X', 'email' => 'x@anonima.com']])
        ->assertStatus(401);

    expect(GrupoEmpresa::where('nome', 'Anonima')->exists())->toBeFalse();
});

test('retorna 422 e não grava nada quando o e-mail do usuário já existe', function () {
    Event::fake([UsuarioCriado::class]);
    $c = cenarioOnboarding();

    cadastrarEmpresa($c, ['nome' => 'Duplicada', 'usuario' => ['nome' => 'Admin 2', 'email' => 'admin.onboarding@exemplo.com']])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['usuario.email']);

    expect(GrupoEmpresa::where('nome', 'Duplicada')->exists())->toBeFalse();
});
