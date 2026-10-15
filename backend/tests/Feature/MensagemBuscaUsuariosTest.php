<?php

/**
 * Busca de destinatários (GET /api/admin/mensagens/usuarios): leitura GLOBAL por design —
 * o Admin escolhe qualquer usuário de qualquer empresa. Estes testes fixam o contrato (campos,
 * filtro, paginação, permissão) antes e depois de a consulta ir para o UsuarioRepository.
 */

use App\Enums\UsuarioStatus;
use App\Models\EntidadeTipo;
use App\Models\Grupo;
use App\Models\GrupoEmpresa;
use App\Models\Permissao;
use App\Models\Usuario;
use App\Models\UsuarioSessao;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tymon\JWTAuth\Facades\JWTAuth;

uses(RefreshDatabase::class);

function cenarioBuscaUsuarios(bool $comPermissao = true): array
{
    $tipoAdmin = EntidadeTipo::create(['chave' => 'admin', 'entidade_tabela' => null]);
    $tipoPrivate = EntidadeTipo::create(['chave' => 'private', 'entidade_tabela' => 'grupo_empresas']);

    $grupoAdmin = Grupo::create(['descricao' => 'Dev', 'entidade_tipo_id' => $tipoAdmin->id, 'entidade_id' => null]);
    $admin = Usuario::create([
        'grupo_id' => $grupoAdmin->id, 'nome' => 'Admin Busca', 'email' => 'admin.busca@exemplo.com',
        'senha' => bcrypt('Senha123@'), 'status' => UsuarioStatus::ATIVO->value,
    ]);

    if ($comPermissao) {
        $permissao = Permissao::create(['chave' => 'admin.mensagem.cadastrar', 'descricao' => 'Cadastrar mensagem']);
        $grupoAdmin->permissoes()->sync([$permissao->id]);
    }

    foreach (['Alfa' => 'alfa', 'Beta' => 'beta'] as $nomeEmpresa => $sufixo) {
        $grupoEmpresa = GrupoEmpresa::create(['nome' => "Empresa {$nomeEmpresa}"]);
        $grupo = Grupo::create(['descricao' => 'Administrador', 'entidade_tipo_id' => $tipoPrivate->id, 'entidade_id' => $grupoEmpresa->id]);
        Usuario::create([
            'grupo_id' => $grupo->id, 'nome' => "Cliente {$nomeEmpresa}", 'email' => "cliente.{$sufixo}@exemplo.com",
            'senha' => bcrypt('Senha123@'), 'status' => UsuarioStatus::ATIVO->value,
        ]);
    }

    $sessao = UsuarioSessao::create(['usuario_id' => $admin->id, 'ativo' => true, 'ultimo_acesso_em' => now()]);

    return ['token' => JWTAuth::claims(['session_id' => $sessao->id])->fromUser($admin)];
}

function buscarUsuariosDestinatarios(array $c, string $query = '')
{
    return test()->withHeader('Authorization', 'Bearer '.$c['token'])->getJson('/api/admin/mensagens/usuarios'.$query);
}

test('o admin encontra usuários de todas as empresas, sem filtro por entidade', function () {
    $c = cenarioBuscaUsuarios();

    $nomes = collect(buscarUsuariosDestinatarios($c)->assertStatus(200)->json('data'))->pluck('nome')->all();

    expect($nomes)->toContain('Cliente Alfa', 'Cliente Beta', 'Admin Busca');
});

test('a busca filtra por parte do nome, sem diferenciar maiúsculas', function () {
    $c = cenarioBuscaUsuarios();

    $nomes = collect(buscarUsuariosDestinatarios($c, '?nome=aLFa')->assertStatus(200)->json('data'))->pluck('nome')->all();

    expect($nomes)->toBe(['Cliente Alfa']);
});

test('a resposta expõe somente id, nome e e-mail e respeita por_pagina', function () {
    $c = cenarioBuscaUsuarios();

    $resposta = buscarUsuariosDestinatarios($c, '?por_pagina=2')->assertStatus(200);

    expect($resposta->json('data'))->toHaveCount(2);
    expect(array_keys($resposta->json('data.0')))->toBe(['id', 'nome', 'email']);
    expect($resposta->json('meta.total'))->toBe(3);
});

test('retorna 403 sem a permissão de cadastrar mensagem', function () {
    buscarUsuariosDestinatarios(cenarioBuscaUsuarios(comPermissao: false))->assertStatus(403);
});

test('retorna 401 sem token', function () {
    cenarioBuscaUsuarios();

    $this->getJson('/api/admin/mensagens/usuarios')->assertStatus(401);
});
