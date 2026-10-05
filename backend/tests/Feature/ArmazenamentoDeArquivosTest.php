<?php

use Illuminate\Foundation\Testing\RefreshDatabase;

use Tymon\JWTAuth\Facades\JWTAuth;

use App\Contracts\Storage\FileStorageInterface;
use App\Enums\ArquivoVisibilidade;
use App\Enums\UsuarioStatus;
use App\Models\Banner;
use App\Models\Chamado;
use App\Models\ChamadoAnexo;
use App\Models\EntidadeTipo;
use App\Models\Grupo;
use App\Models\Permissao;
use App\Models\Usuario;
use App\Models\UsuarioSessao;
use App\Services\Storage\LaravelFileStorage;
use Tests\Support\ArquivosEmMemoria;

uses(RefreshDatabase::class);

/*
 * Estes testes trocam o provider por um dublê em memória (ArquivosEmMemoria) e exercitam os
 * fluxos reais da API. Se alguma regra de negócio ainda dependesse de `Storage::disk(...)`,
 * o arquivo cairia no disco do Laravel e as asserções abaixo falhariam — é a prova de que
 * a aplicação está desacoplada do provider.
 */

const PNG_ARQ = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
const PDF_ARQ = "%PDF-1.4\n%âãÏÓ\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>";

function usarArquivosEmMemoria(): ArquivosEmMemoria
{
    $memoria = new ArquivosEmMemoria();
    app()->instance(FileStorageInterface::class, $memoria);

    return $memoria;
}

function tokenArq(Usuario $usuario): string
{
    $sessao = UsuarioSessao::create(['usuario_id' => $usuario->id, 'ativo' => true, 'ultimo_acesso_em' => now()]);

    return JWTAuth::claims(['session_id' => $sessao->id])->fromUser($usuario);
}

function permitirArq(Grupo $grupo, string ...$chaves): void
{
    foreach ($chaves as $chave) {
        $p = Permissao::firstOrCreate(['chave' => $chave], ['descricao' => $chave]);
        $grupo->permissoes()->syncWithoutDetaching([$p->id]);
    }
}

function cenarioArq(): array
{
    $tipoAdmin = EntidadeTipo::create(['chave' => 'admin', 'entidade_tabela' => null]);
    $tipoPrivate = EntidadeTipo::create(['chave' => 'private', 'entidade_tabela' => 'grupo_empresas']);

    $grupoAdmin = Grupo::create(['descricao' => 'Dev', 'entidade_tipo_id' => $tipoAdmin->id, 'entidade_id' => null]);
    $grupoPrivate = Grupo::create(['descricao' => 'Cliente', 'entidade_tipo_id' => $tipoPrivate->id, 'entidade_id' => null]);

    $criar = fn (Grupo $g, string $email) => Usuario::create([
        'grupo_id' => $g->id,
        'nome' => 'Usuário ' . $email,
        'email' => $email,
        'senha' => bcrypt('Senha123@'),
        'status' => UsuarioStatus::ATIVO->value,
    ]);

    return [
        'grupoAdmin' => $grupoAdmin,
        'grupoPrivate' => $grupoPrivate,
        'admin' => $criar($grupoAdmin, 'admin.arq@exemplo.com'),
        'private' => $criar($grupoPrivate, 'cliente.arq@exemplo.com'),
    ];
}

// ---------------------------------------------------------------------------------------
// Container / configuração
// ---------------------------------------------------------------------------------------

test('o driver padrão é local e resolve o adapter do filesystem do Laravel', function () {
    expect(config('api.storage.driver'))->toBe('local');
    expect(app(FileStorageInterface::class))->toBeInstanceOf(LaravelFileStorage::class);
});

test('FILE_STORAGE_DRIVER=s3 usa os discos S3 sem tocar em código de negócio', function () {
    config(['api.storage.driver' => 's3']);
    Illuminate\Support\Facades\Storage::fake('s3_public');
    Illuminate\Support\Facades\Storage::fake('s3_private');

    $storage = app(FileStorageInterface::class);

    $storage->put(ArquivoVisibilidade::PUBLICO, 'avatars/a.png', 'x');
    $storage->put(ArquivoVisibilidade::PRIVADO, 'chamados/1/a.pdf', 'y');

    Illuminate\Support\Facades\Storage::disk('s3_public')->assertExists('avatars/a.png');
    Illuminate\Support\Facades\Storage::disk('s3_private')->assertExists('chamados/1/a.pdf');
});

test('os discos s3_public e s3_private usam prefixos diferentes no mesmo bucket', function () {
    expect(config('filesystems.disks.s3_public.root'))->toBe('public');
    expect(config('filesystems.disks.s3_private.root'))->toBe('private');
    expect(config('filesystems.disks.s3_private.url'))->toBeNull();
});

test('um provider novo é registrado só por configuração', function () {
    config([
        'api.storage.driver' => 'memoria',
        'api.storage.drivers.memoria' => ['adapter' => ArquivosEmMemoria::class],
    ]);

    expect(app(FileStorageInterface::class))->toBeInstanceOf(ArquivosEmMemoria::class);
});

test('driver desconhecido falha com mensagem clara', function () {
    config(['api.storage.driver' => 'inexistente']);

    app(FileStorageInterface::class);
})->throws(InvalidArgumentException::class, "FILE_STORAGE_DRIVER 'inexistente'");

// ---------------------------------------------------------------------------------------
// Avatar (público)
// ---------------------------------------------------------------------------------------

test('avatar é gravado como arquivo público e a URL vem do provider', function () {
    $memoria = usarArquivosEmMemoria();
    $c = cenarioArq();

    $resposta = $this->withHeader('Authorization', 'Bearer ' . tokenArq($c['private']))
        ->patchJson('/api/perfil/avatar', ['avatar' => PNG_ARQ])
        ->assertOk();

    $caminhos = $memoria->caminhos(ArquivoVisibilidade::PUBLICO);

    expect($caminhos)->toHaveCount(1);
    expect($caminhos[0])->toMatch('#^avatars/[0-9a-f-]{36}\.png$#');
    expect($memoria->caminhos(ArquivoVisibilidade::PRIVADO))->toBe([]);
    expect($c['private']->fresh()->getRawOriginal('avatar'))->toBe($caminhos[0]);
    expect($resposta->json('data.avatar'))->toBe('https://arquivos.exemplo.com/' . $caminhos[0]);
});

test('trocar o avatar remove o arquivo anterior', function () {
    $memoria = usarArquivosEmMemoria();
    $c = cenarioArq();
    $token = tokenArq($c['private']);

    $this->withHeader('Authorization', "Bearer {$token}")->patchJson('/api/perfil/avatar', ['avatar' => PNG_ARQ])->assertOk();
    $primeiro = $memoria->caminhos(ArquivoVisibilidade::PUBLICO)[0];

    $this->withHeader('Authorization', "Bearer {$token}")->patchJson('/api/perfil/avatar', ['avatar' => PNG_ARQ])->assertOk();
    $caminhos = $memoria->caminhos(ArquivoVisibilidade::PUBLICO);

    expect($caminhos)->toHaveCount(1)->and($caminhos[0])->not->toBe($primeiro);
});

test('o avatar do admin também usa o mesmo storage', function () {
    $memoria = usarArquivosEmMemoria();
    $c = cenarioArq();

    $this->withHeader('Authorization', 'Bearer ' . tokenArq($c['admin']))
        ->patchJson('/api/admin/perfil/avatar', ['avatar' => PNG_ARQ])
        ->assertOk();

    expect($memoria->caminhos(ArquivoVisibilidade::PUBLICO))->toHaveCount(1);
});

// ---------------------------------------------------------------------------------------
// Banner (público)
// ---------------------------------------------------------------------------------------

test('imagens de banner são gravadas como públicas e removidas ao sair da lista', function () {
    $memoria = usarArquivosEmMemoria();
    $c = cenarioArq();
    permitirArq($c['grupoAdmin'], 'admin.banner.cadastrar', 'admin.banner.atualizar');
    $token = tokenArq($c['admin']);

    $criado = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/admin/banners', [
            'titulo' => 'Campanha',
            'inicio_em' => now()->toDateTimeString(),
            'direcionamento' => ['tipo' => 'geral'],
            'imagens' => [['nome' => 'a.png', 'conteudo' => PNG_ARQ], ['nome' => 'b.png', 'conteudo' => PNG_ARQ]],
            'links' => [],
        ])
        ->assertStatus(201);

    $bannerId = $criado->json('data.id');
    $caminhos = $memoria->caminhos(ArquivoVisibilidade::PUBLICO);

    expect($caminhos)->toHaveCount(2);
    foreach ($caminhos as $caminho) {
        expect($caminho)->toStartWith("banners/{$bannerId}/")->toEndWith('.png');
    }
    expect($memoria->caminhos(ArquivoVisibilidade::PRIVADO))->toBe([]);
    expect($criado->json('data.imagens.0.url'))->toStartWith('https://arquivos.exemplo.com/banners/');

    // Mantém só a primeira imagem: a segunda é removida do registro E do storage.
    $manter = $criado->json('data.imagens.0.id');

    $this->withHeader('Authorization', "Bearer {$token}")
        ->putJson("/api/admin/banners/{$bannerId}", [
            'titulo' => 'Campanha',
            'inicio_em' => Banner::find($bannerId)->inicio_em->toDateTimeString(),
            'direcionamento' => ['tipo' => 'geral'],
            'imagens' => [['id' => $manter]],
            'links' => [],
        ])
        ->assertOk();

    expect($memoria->caminhos(ArquivoVisibilidade::PUBLICO))->toHaveCount(1);
});

// ---------------------------------------------------------------------------------------
// Anexos de chamado (privado)
// ---------------------------------------------------------------------------------------

function abrirChamadoComAnexo($teste, array $c): array
{
    permitirArq($c['grupoPrivate'], 'private.chamado.abrir', 'private.chamado.listar');

    $resposta = $teste->withHeader('Authorization', 'Bearer ' . tokenArq($c['private']))
        ->postJson('/api/chamados', [
            'tipo' => 'duvida',
            'assunto' => 'Com anexo',
            'mensagem' => '<p>Segue.</p>',
            'anexos' => [['nome' => 'documento.pdf', 'conteudo' => base64_encode(PDF_ARQ)]],
        ])
        ->assertStatus(201);

    $url = parse_url($resposta->json('data.mensagens.0.anexos.0.url'));

    return [ChamadoAnexo::first(), $url['path'] . '?' . $url['query']];
}

test('anexo de chamado é gravado no armazenamento privado, nunca no público', function () {
    $memoria = usarArquivosEmMemoria();
    $c = cenarioArq();

    [$anexo] = abrirChamadoComAnexo($this, $c);

    $caminho = $anexo->caminhoArmazenado();

    expect($caminho)->toStartWith('chamados/' . Chamado::first()->id . '/')->toEndWith('.pdf');
    expect($memoria->exists(ArquivoVisibilidade::PRIVADO, $caminho))->toBeTrue();
    expect($memoria->caminhos(ArquivoVisibilidade::PUBLICO))->toBe([]);
});

test('o download do anexo é entregue pelo provider via link assinado', function () {
    usarArquivosEmMemoria();
    $c = cenarioArq();

    [, $relativa] = abrirChamadoComAnexo($this, $c);

    $download = $this->get($relativa)->assertOk();

    expect($download->getContent())->toBe(PDF_ARQ);
    expect($download->headers->get('Content-Disposition'))->toContain('attachment')->toContain('documento.pdf');
    $download->assertHeader('X-Content-Type-Options', 'nosniff');

    $this->get(strtok($relativa, '?'))->assertStatus(403);
});

test('anexo legado que ainda está no armazenamento público continua sendo entregue', function () {
    $memoria = usarArquivosEmMemoria();
    $c = cenarioArq();

    [$anexo, $relativa] = abrirChamadoComAnexo($this, $c);
    $memoria->move(ArquivoVisibilidade::PRIVADO, ArquivoVisibilidade::PUBLICO, $anexo->caminhoArmazenado());

    expect($this->get($relativa)->assertOk()->getContent())->toBe(PDF_ARQ);
});

test('anexo sem arquivo em nenhum armazenamento responde 404', function () {
    $memoria = usarArquivosEmMemoria();
    $c = cenarioArq();

    [$anexo, $relativa] = abrirChamadoComAnexo($this, $c);
    $memoria->delete(ArquivoVisibilidade::PRIVADO, $anexo->caminhoArmazenado());

    $this->get($relativa)->assertNotFound();
});

test('falha ao gravar o anexo não cria o registro e devolve erro de negócio', function () {
    $memoria = usarArquivosEmMemoria();
    $memoria->falharNaGravacao = true;
    $c = cenarioArq();
    permitirArq($c['grupoPrivate'], 'private.chamado.abrir');

    $this->withHeader('Authorization', 'Bearer ' . tokenArq($c['private']))
        ->postJson('/api/chamados', [
            'tipo' => 'duvida',
            'assunto' => 'Com anexo',
            'mensagem' => '<p>Segue.</p>',
            'anexos' => [['nome' => 'documento.pdf', 'conteudo' => base64_encode(PDF_ARQ)]],
        ])
        ->assertStatus(400)
        ->assertJsonPath('errors.business.0', 'Não foi possível salvar o anexo. Tente novamente.');

    expect(ChamadoAnexo::count())->toBe(0);
});

// ---------------------------------------------------------------------------------------
// Comando de migração de anexos legados
// ---------------------------------------------------------------------------------------

function anexoLegado(string $caminho): ChamadoAnexo
{
    $c = cenarioArq();
    $chamado = Chamado::create([
        'ticket' => 'SUP-2026-' . random_int(100000, 999999),
        'usuario_id' => $c['private']->id,
        'tipo' => 'duvida',
        'assunto' => 'Legado',
        'status' => 'aberto',
        'prioridade' => App\Enums\ChamadoPrioridade::NORMAL->value,
        'aberto_em' => now(),
        'ultima_interacao_em' => now(),
    ]);
    $mensagem = $chamado->mensagens()->create(['usuario_id' => $c['private']->id, 'mensagem' => 'x']);

    return ChamadoAnexo::create([
        'chamado_mensagem_id' => $mensagem->id,
        'nome_original' => 'antigo.pdf',
        'caminho' => $caminho,
        'mime_type' => 'application/pdf',
        'tamanho' => 3,
    ]);
}

test('o comando move anexos do armazenamento público para o privado', function () {
    $memoria = usarArquivosEmMemoria();
    $memoria->put(ArquivoVisibilidade::PUBLICO, 'chamados/1/antigo.pdf', 'abc');
    anexoLegado('chamados/1/antigo.pdf');

    $this->artisan('chamados:mover-anexos-privados')->assertExitCode(0);

    expect($memoria->exists(ArquivoVisibilidade::PRIVADO, 'chamados/1/antigo.pdf'))->toBeTrue();
    expect($memoria->exists(ArquivoVisibilidade::PUBLICO, 'chamados/1/antigo.pdf'))->toBeFalse();
});

test('o comando em --dry-run não move nada', function () {
    $memoria = usarArquivosEmMemoria();
    $memoria->put(ArquivoVisibilidade::PUBLICO, 'chamados/1/antigo.pdf', 'abc');
    anexoLegado('chamados/1/antigo.pdf');

    $this->artisan('chamados:mover-anexos-privados --dry-run')->assertExitCode(0);

    expect($memoria->exists(ArquivoVisibilidade::PUBLICO, 'chamados/1/antigo.pdf'))->toBeTrue();
    expect($memoria->exists(ArquivoVisibilidade::PRIVADO, 'chamados/1/antigo.pdf'))->toBeFalse();
});

test('o comando é idempotente e não falha quando o arquivo já está no privado', function () {
    $memoria = usarArquivosEmMemoria();
    $memoria->put(ArquivoVisibilidade::PRIVADO, 'chamados/1/antigo.pdf', 'abc');
    anexoLegado('chamados/1/antigo.pdf');

    $this->artisan('chamados:mover-anexos-privados')->assertExitCode(0);
    $this->artisan('chamados:mover-anexos-privados')->assertExitCode(0);

    expect($memoria->exists(ArquivoVisibilidade::PRIVADO, 'chamados/1/antigo.pdf'))->toBeTrue();
});
