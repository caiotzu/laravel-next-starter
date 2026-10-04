<?php

/**
 * Cobertura de App\Http\Controllers\Private\UsuarioController /
 * App\Services\UsuarioService, hoje sem nenhum teste dedicado.
 *
 * Foco: autorização (permissão), validação de payload e, principalmente,
 * isolamento entre empresas (IDOR/BOLA) — o service escopa toda consulta
 * pelo entidade_tipo_id/entidade_id do usuário autenticado, então os testes
 * abaixo provam que uma empresa (grupo_empresa) "A" nunca alcança um
 * usuário ou um grupo de outra empresa "B", mesmo informando o ID
 * diretamente na URL ou no corpo da requisição.
 */

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;

use Tymon\JWTAuth\Facades\JWTAuth;

use App\Models\Usuario;
use App\Models\Grupo;
use App\Models\GrupoEmpresa;
use App\Models\EntidadeTipo;
use App\Models\UsuarioSessao;
use App\Models\Permissao;

use App\Events\UsuarioCriado;

use App\Enums\UsuarioStatus;

uses(RefreshDatabase::class);

function permitirUsuarioTeste(Grupo $grupo, string ...$chaves): void
{
    foreach ($chaves as $chave) {
        $permissao = Permissao::firstOrCreate(['chave' => $chave], ['descricao' => $chave]);
        $grupo->permissoes()->syncWithoutDetaching([$permissao->id]);
    }
}

function autenticarUsuarioTeste(Usuario $usuario): string
{
    $sessao = UsuarioSessao::create([
        'usuario_id' => $usuario->id,
        'ativo' => true,
        'ultimo_acesso_em' => now(),
    ]);

    return JWTAuth::claims(['session_id' => $sessao->id])->fromUser($usuario);
}

/**
 * Duas empresas (grupo_empresa) distintas, "A" e "B", cada uma com o seu
 * próprio grupo de "Administrador" e um usuário logado com a permissão de
 * gestão de usuários. Espelha o cenário já usado em EscopoEntidadeTest.php.
 */
function cenarioUsuarioTeste(): array
{
    $tipoAdmin = EntidadeTipo::create(['chave' => 'admin', 'entidade_tabela' => null]);
    $tipoPrivate = EntidadeTipo::create(['chave' => 'private', 'entidade_tabela' => 'grupo_empresas']);

    $criarEmpresa = function (string $sufixo) use ($tipoPrivate) {
        $empresa = GrupoEmpresa::create(['nome' => "Empresa {$sufixo}"]);

        $grupo = Grupo::create([
            'descricao' => "Administrador {$sufixo}",
            'entidade_tipo_id' => $tipoPrivate->id,
            'entidade_id' => $empresa->id,
        ]);

        $usuarioLogado = Usuario::create([
            'grupo_id' => $grupo->id,
            'nome' => "Gestor {$sufixo}",
            'email' => "gestor.{$sufixo}@exemplo.com",
            'senha' => bcrypt('Senha123@'),
            'status' => UsuarioStatus::ATIVO->value,
        ]);

        permitirUsuarioTeste(
            $grupo,
            'private.usuario.cadastrar',
            'private.usuario.atualizar',
            'private.usuario.visualizar',
            'private.usuario.excluir',
            'private.usuario.ativar',
            'private.usuario.listar',
        );

        return [
            'empresa' => $empresa,
            'grupo' => $grupo,
            'usuarioLogado' => $usuarioLogado,
            'auth' => autenticarUsuarioTeste($usuarioLogado),
        ];
    };

    return [
        'tipoAdmin' => $tipoAdmin,
        'A' => $criarEmpresa('A'),
        'B' => $criarEmpresa('B'),
    ];
}

// ---------------------------------------------------------------------------------------
// Happy path: cadastro, atualização, visualização, listagem, exclusão e reativação
// ---------------------------------------------------------------------------------------

test('empresa A cadastra um usuário no próprio grupo e dispara o evento de boas-vindas', function () {
    Event::fake([UsuarioCriado::class]);

    $c = cenarioUsuarioTeste();

    $resposta = $this->withHeader('Authorization', "Bearer {$c['A']['auth']}")
        ->postJson('/api/usuarios', [
            'grupo_id' => $c['A']['grupo']->id,
            'nome' => 'Novo Usuário A',
            'email' => 'novo.usuario.a@exemplo.com',
        ])
        ->assertStatus(201);

    expect($resposta->json('data.status'))->toBe(UsuarioStatus::CONVIDADO->value);

    $usuario = Usuario::where('email', 'novo.usuario.a@exemplo.com')->first();
    expect($usuario)->not->toBeNull();
    expect($usuario->grupo_id)->toBe($c['A']['grupo']->id);

    Event::assertDispatched(UsuarioCriado::class, fn ($event) => $event->usuario->is($usuario));
});

test('empresa A visualiza, atualiza e lista os próprios usuários normalmente', function () {
    $c = cenarioUsuarioTeste();

    $usuarioA = Usuario::create([
        'grupo_id' => $c['A']['grupo']->id,
        'nome' => 'Colaborador A',
        'email' => 'colaborador.a@exemplo.com',
        'senha' => bcrypt('Senha123@'),
        'status' => UsuarioStatus::ATIVO->value,
    ]);

    $this->withHeader('Authorization', "Bearer {$c['A']['auth']}")
        ->getJson("/api/usuarios/{$usuarioA->id}")
        ->assertOk()
        ->assertJsonPath('data.email', 'colaborador.a@exemplo.com');

    $this->withHeader('Authorization', "Bearer {$c['A']['auth']}")
        ->putJson("/api/usuarios/{$usuarioA->id}", [
            'grupo_id' => $c['A']['grupo']->id,
            'nome' => 'Colaborador A Atualizado',
            'email' => 'colaborador.a@exemplo.com',
        ])
        ->assertOk()
        ->assertJsonPath('data.nome', 'Colaborador A Atualizado');

    $listagem = $this->withHeader('Authorization', "Bearer {$c['A']['auth']}")
        ->getJson('/api/usuarios')
        ->assertOk();

    $emails = collect($listagem->json('data'))->pluck('email')->all();
    expect($emails)->toContain('colaborador.a@exemplo.com');
    expect($emails)->not->toContain('gestor.B@exemplo.com');
});

test('empresa A exclui (soft delete) e depois reativa o próprio usuário', function () {
    $c = cenarioUsuarioTeste();

    $usuarioA = Usuario::create([
        'grupo_id' => $c['A']['grupo']->id,
        'nome' => 'Colaborador Removível A',
        'email' => 'removivel.a@exemplo.com',
        'senha' => bcrypt('Senha123@'),
        'status' => UsuarioStatus::ATIVO->value,
    ]);

    $this->withHeader('Authorization', "Bearer {$c['A']['auth']}")
        ->deleteJson("/api/usuarios/{$usuarioA->id}")
        ->assertStatus(204);

    expect($usuarioA->fresh()->trashed())->toBeTrue();

    $this->withHeader('Authorization', "Bearer {$c['A']['auth']}")
        ->patchJson("/api/usuarios/{$usuarioA->id}/ativar")
        ->assertOk();

    expect($usuarioA->fresh()->trashed())->toBeFalse();
});

// ---------------------------------------------------------------------------------------
// IDOR / BOLA: empresa A não alcança nada da empresa B
// ---------------------------------------------------------------------------------------

test('empresa A não consegue cadastrar usuário informando o grupo da empresa B', function () {
    Event::fake([UsuarioCriado::class]);

    $c = cenarioUsuarioTeste();

    $this->withHeader('Authorization', "Bearer {$c['A']['auth']}")
        ->postJson('/api/usuarios', [
            'grupo_id' => $c['B']['grupo']->id, // grupo de outra empresa, mas existe na tabela "grupos"
            'nome' => 'Usuário Infiltrado',
            'email' => 'infiltrado@exemplo.com',
        ])
        ->assertStatus(400)
        ->assertJsonPath('errors.business.0', 'O grupo selecionado não é válido para este cadastro.');

    expect(Usuario::where('email', 'infiltrado@exemplo.com')->exists())->toBeFalse();
    Event::assertNotDispatched(UsuarioCriado::class);
});

test('empresa A não consegue visualizar um usuário da empresa B', function () {
    $c = cenarioUsuarioTeste();

    $usuarioB = Usuario::create([
        'grupo_id' => $c['B']['grupo']->id,
        'nome' => 'Colaborador B',
        'email' => 'colaborador.b@exemplo.com',
        'senha' => bcrypt('Senha123@'),
        'status' => UsuarioStatus::ATIVO->value,
    ]);

    // A exceção é lançada pelo Service como BusinessException (não ModelNotFoundException),
    // e o handler global (bootstrap/app.php) mapeia toda BusinessException não capturada
    // para 400, independentemente do statusCode informado na exceção.
    $this->withHeader('Authorization', "Bearer {$c['A']['auth']}")
        ->getJson("/api/usuarios/{$usuarioB->id}")
        ->assertStatus(400)
        ->assertJsonPath('errors.business.0', 'Usuário não encontrado.');
});

test('empresa A não consegue atualizar um usuário da empresa B mesmo enviando o grupo_id correto de B', function () {
    $c = cenarioUsuarioTeste();

    $usuarioB = Usuario::create([
        'grupo_id' => $c['B']['grupo']->id,
        'nome' => 'Colaborador B',
        'email' => 'colaborador.b.upd@exemplo.com',
        'senha' => bcrypt('Senha123@'),
        'status' => UsuarioStatus::ATIVO->value,
    ]);

    $this->withHeader('Authorization', "Bearer {$c['A']['auth']}")
        ->putJson("/api/usuarios/{$usuarioB->id}", [
            'grupo_id' => $c['B']['grupo']->id,
            'nome' => 'Sequestrado pela empresa A',
            'email' => 'colaborador.b.upd@exemplo.com',
        ])
        ->assertStatus(400)
        // O Service valida o grupo (que pertence à empresa B) antes de buscar o usuário.
        ->assertJsonPath('errors.business.0', 'O grupo selecionado não é válido para este cadastro.');

    expect($usuarioB->fresh()->nome)->toBe('Colaborador B');
});

test('empresa A não consegue excluir nem reativar um usuário da empresa B', function () {
    $c = cenarioUsuarioTeste();

    $usuarioB = Usuario::create([
        'grupo_id' => $c['B']['grupo']->id,
        'nome' => 'Colaborador B',
        'email' => 'colaborador.b.del@exemplo.com',
        'senha' => bcrypt('Senha123@'),
        'status' => UsuarioStatus::ATIVO->value,
    ]);

    $this->withHeader('Authorization', "Bearer {$c['A']['auth']}")
        ->deleteJson("/api/usuarios/{$usuarioB->id}")
        ->assertStatus(400);

    expect($usuarioB->fresh()->trashed())->toBeFalse();

    $usuarioB->delete();

    $this->withHeader('Authorization', "Bearer {$c['A']['auth']}")
        ->patchJson("/api/usuarios/{$usuarioB->id}/ativar")
        ->assertStatus(400);

    expect($usuarioB->fresh()->trashed())->toBeTrue();
});

test('listagem da empresa A nunca retorna usuários da empresa B, mesmo filtrando pelo grupo_id de B', function () {
    $c = cenarioUsuarioTeste();

    Usuario::create([
        'grupo_id' => $c['B']['grupo']->id,
        'nome' => 'Colaborador B Listagem',
        'email' => 'colaborador.b.list@exemplo.com',
        'senha' => bcrypt('Senha123@'),
        'status' => UsuarioStatus::ATIVO->value,
    ]);

    $listagem = $this->withHeader('Authorization', "Bearer {$c['A']['auth']}")
        ->getJson("/api/usuarios?grupo_id={$c['B']['grupo']->id}")
        ->assertOk();

    expect($listagem->json('data'))->toBeEmpty();
});

// ---------------------------------------------------------------------------------------
// Autorização (permissão) e validação
// ---------------------------------------------------------------------------------------

test('usuário sem a permissão private.usuario.* recebe 403 em cada ação', function () {
    $c = cenarioUsuarioTeste();

    // Remove todas as permissões do grupo A.
    $c['A']['grupo']->permissoes()->detach();

    $usuarioA = Usuario::create([
        'grupo_id' => $c['A']['grupo']->id,
        'nome' => 'Colaborador Sem Permissao',
        'email' => 'sem.permissao@exemplo.com',
        'senha' => bcrypt('Senha123@'),
        'status' => UsuarioStatus::ATIVO->value,
    ]);

    $auth = "Bearer {$c['A']['auth']}";

    $this->withHeader('Authorization', $auth)->postJson('/api/usuarios', [
        'grupo_id' => $c['A']['grupo']->id, 'nome' => 'X', 'email' => 'x@exemplo.com',
    ])->assertStatus(403);

    $this->withHeader('Authorization', $auth)->getJson("/api/usuarios/{$usuarioA->id}")->assertStatus(403);
    $this->withHeader('Authorization', $auth)->putJson("/api/usuarios/{$usuarioA->id}", [
        'grupo_id' => $c['A']['grupo']->id, 'nome' => 'X', 'email' => 'colaborador.sem.permissao@exemplo.com',
    ])->assertStatus(403);
    $this->withHeader('Authorization', $auth)->deleteJson("/api/usuarios/{$usuarioA->id}")->assertStatus(403);
    $this->withHeader('Authorization', $auth)->patchJson("/api/usuarios/{$usuarioA->id}/ativar")->assertStatus(403);
    $this->withHeader('Authorization', $auth)->getJson('/api/usuarios')->assertStatus(403);
});

test('cadastro de usuário exige nome e e-mail válidos, e e-mail não pode se repetir', function () {
    $c = cenarioUsuarioTeste();
    $auth = "Bearer {$c['A']['auth']}";

    $this->withHeader('Authorization', $auth)
        ->postJson('/api/usuarios', [])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['grupo_id', 'nome', 'email']);

    $this->withHeader('Authorization', $auth)
        ->postJson('/api/usuarios', [
            'grupo_id' => $c['A']['grupo']->id,
            'nome' => 'Duplicado',
            'email' => 'e-mail-invalido',
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['email']);

    // E-mail já usado pelo próprio gestor logado.
    $this->withHeader('Authorization', $auth)
        ->postJson('/api/usuarios', [
            'grupo_id' => $c['A']['grupo']->id,
            'nome' => 'Duplicado',
            'email' => $c['A']['usuarioLogado']->email,
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['email']);
});

test('atualização de usuário exige ao menos um dado válido e mantém unicidade de e-mail', function () {
    $c = cenarioUsuarioTeste();
    $auth = "Bearer {$c['A']['auth']}";

    $usuarioA = Usuario::create([
        'grupo_id' => $c['A']['grupo']->id,
        'nome' => 'Colaborador Unico A',
        'email' => 'unico.a@exemplo.com',
        'senha' => bcrypt('Senha123@'),
        'status' => UsuarioStatus::ATIVO->value,
    ]);

    // Tentando "roubar" o e-mail do próprio gestor logado da mesma empresa.
    $this->withHeader('Authorization', $auth)
        ->putJson("/api/usuarios/{$usuarioA->id}", [
            'grupo_id' => $c['A']['grupo']->id,
            'nome' => 'Colaborador Unico A',
            'email' => $c['A']['usuarioLogado']->email,
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['email']);

    // Reenviar o mesmo e-mail do próprio registro (ignore) deve ser aceito.
    $this->withHeader('Authorization', $auth)
        ->putJson("/api/usuarios/{$usuarioA->id}", [
            'grupo_id' => $c['A']['grupo']->id,
            'nome' => 'Colaborador Unico A Renomeado',
            'email' => 'unico.a@exemplo.com',
        ])
        ->assertOk();
});

test('status de convidado não é aceito na atualização de status via rota administrativa', function () {
    $c = cenarioUsuarioTeste();
    $auth = "Bearer {$c['A']['auth']}";

    $usuarioA = Usuario::create([
        'grupo_id' => $c['A']['grupo']->id,
        'nome' => 'Colaborador Status A',
        'email' => 'status.a@exemplo.com',
        'senha' => bcrypt('Senha123@'),
        'status' => UsuarioStatus::ATIVO->value,
    ]);

    $this->withHeader('Authorization', $auth)
        ->putJson("/api/usuarios/{$usuarioA->id}", [
            'grupo_id' => $c['A']['grupo']->id,
            'nome' => 'Colaborador Status A',
            'email' => 'status.a@exemplo.com',
            'status' => 'convidado',
        ])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['status']);
});
