<?php

/**
 * A atualização de endereço deve exigir a permissão de ENDEREÇO (…endereco.atualizar), a mesma
 * que os seeders criam e que o frontend usa para exibir o botão de editar — e não a de contato.
 */

use App\Enums\EmpresaEnderecoTipo;
use App\Enums\UsuarioStatus;
use App\Models\Empresa;
use App\Models\EmpresaEndereco;
use App\Models\EntidadeTipo;
use App\Models\Grupo;
use App\Models\GrupoEmpresa;
use App\Models\Municipio;
use App\Models\Permissao;
use App\Models\Usuario;
use App\Models\UsuarioSessao;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tymon\JWTAuth\Facades\JWTAuth;

uses(RefreshDatabase::class);

/**
 * @param  'admin'|'private'  $contexto
 * @param  list<string>  $permissoes
 */
function cenarioEnderecoAutz(string $contexto, array $permissoes): array
{
    $tipoAdmin = EntidadeTipo::create(['chave' => 'admin', 'entidade_tabela' => null]);
    $tipoPrivate = EntidadeTipo::create(['chave' => 'private', 'entidade_tabela' => 'grupo_empresas']);

    $grupoEmpresa = GrupoEmpresa::create(['nome' => 'Cliente Endereco']);
    $empresa = Empresa::create([
        'grupo_empresa_id' => $grupoEmpresa->id, 'cnpj' => '33333333000103', 'nome_fantasia' => 'Empresa Endereco',
        'razao_social' => 'Empresa Endereco LTDA', 'inscricao_estadual' => null, 'inscricao_municipal' => null, 'uf' => 'SP',
    ]);
    $municipio = Municipio::create(['nome' => 'Cidade Teste', 'uf' => 'SP', 'codigo_ibge' => '9999999', 'codigo_siafi' => '9999']);
    $endereco = EmpresaEndereco::create([
        'empresa_id' => $empresa->id, 'tipo' => EmpresaEnderecoTipo::COMERCIAL->value, 'municipio_id' => $municipio->id,
        'ativo' => true, 'principal' => false, 'cep' => '01001000', 'logradouro' => 'Rua A', 'numero' => '1', 'bairro' => 'Centro',
    ]);

    $grupo = $contexto === 'admin'
        ? Grupo::create(['descricao' => 'Suporte', 'entidade_tipo_id' => $tipoAdmin->id, 'entidade_id' => null])
        : Grupo::create(['descricao' => 'Administrador', 'entidade_tipo_id' => $tipoPrivate->id, 'entidade_id' => $grupoEmpresa->id]);

    $grupo->permissoes()->sync(collect($permissoes)->map(
        fn (string $chave) => Permissao::create(['chave' => $chave, 'descricao' => $chave])->id
    )->all());

    $usuario = Usuario::create([
        'grupo_id' => $grupo->id, 'nome' => 'Usuario Endereco', 'email' => "endereco.{$contexto}@exemplo.com",
        'senha' => bcrypt('Senha123@'), 'status' => UsuarioStatus::ATIVO->value,
    ]);
    $sessao = UsuarioSessao::create(['usuario_id' => $usuario->id, 'ativo' => true, 'ultimo_acesso_em' => now()]);

    return [
        'token' => JWTAuth::claims(['session_id' => $sessao->id])->fromUser($usuario),
        'url' => ($contexto === 'admin' ? '/api/admin' : '/api')."/empresas/{$empresa->id}/enderecos/{$endereco->id}",
        'dados' => [
            'tipo' => EmpresaEnderecoTipo::FISCAL->value, 'municipio_id' => $municipio->id, 'principal' => false, 'ativo' => true,
            'cep' => '01001000', 'logradouro' => 'Rua Nova', 'numero' => '10', 'bairro' => 'Centro', 'complemento' => null,
        ],
    ];
}

function atualizarEnderecoAutz(array $c)
{
    return test()->withHeader('Authorization', 'Bearer '.$c['token'])->putJson($c['url'], $c['dados']);
}

test('private com private.empresa.endereco.atualizar consegue atualizar o endereço', function () {
    atualizarEnderecoAutz(cenarioEnderecoAutz('private', ['private.empresa.endereco.atualizar']))
        ->assertStatus(200);
});

test('private só com a permissão de contato não consegue atualizar o endereço', function () {
    atualizarEnderecoAutz(cenarioEnderecoAutz('private', ['private.empresa.contato.atualizar']))
        ->assertStatus(403);
});

test('admin com admin.empresa.endereco.atualizar consegue atualizar o endereço', function () {
    atualizarEnderecoAutz(cenarioEnderecoAutz('admin', ['admin.empresa.endereco.atualizar']))
        ->assertStatus(200);
});

test('admin só com a permissão de contato não consegue atualizar o endereço', function () {
    atualizarEnderecoAutz(cenarioEnderecoAutz('admin', ['admin.empresa.contato.atualizar']))
        ->assertStatus(403);
});
