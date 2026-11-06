<?php

/**
 * Avaliação de segurança de 2026-10 (SEC-008 / SEC-012): testes dos achados corrigidos no backend.
 *
 *  - F-05  `/lookup/administradores` não pode enumerar a equipe interna;
 *  - F-08  exceções de biblioteca não vazam a mensagem original em produção;
 *  - F-12  upload em base64: o tamanho do TEXTO é recusado antes de decodificar;
 *  - SEC-012  limite de tentativas do 2FA por USUÁRIO (e teto generoso por IP), para que os
 *             colegas de um mesmo escritório (mesmo IP público) não se bloqueiem;
 *  - ESCRITÓRIO  login e 2FA não dividem mais o limitador `api-publica` (10 req/min por IP):
 *             vários usuários atrás do mesmo IP entram juntos; falhas de login por IP continuam
 *             limitadas; 429 em português com Retry-After.
 *
 * Os helpers têm prefixo `aval26` para não colidirem com os de outros arquivos de teste (as
 * funções do Pest são globais).
 */

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Route;

use PragmaRX\Google2FA\Google2FA;
use Tymon\JWTAuth\Facades\JWTAuth;

use App\Models\Usuario;
use App\Models\Grupo;
use App\Models\GrupoEmpresa;
use App\Models\Permissao;
use App\Models\UsuarioSessao;
use App\Models\EntidadeTipo as EntidadeTipoModel;

use App\Enums\UsuarioStatus;
use App\Support\LimiteBase64;

uses(RefreshDatabase::class);

function aval26Cenario(): array
{
    $tipoAdmin = EntidadeTipoModel::create(['chave' => 'admin', 'entidade_tabela' => null]);
    $tipoPrivate = EntidadeTipoModel::create(['chave' => 'private', 'entidade_tabela' => 'grupo_empresas']);

    $grupoEmpresa = GrupoEmpresa::create(['nome' => 'Cliente Aval26']);

    $grupoAdmin = Grupo::create(['descricao' => 'Suporte', 'entidade_tipo_id' => $tipoAdmin->id, 'entidade_id' => null]);
    $grupoPrivate = Grupo::create(['descricao' => 'Clientes', 'entidade_tipo_id' => $tipoPrivate->id, 'entidade_id' => $grupoEmpresa->id]);

    return compact('grupoAdmin', 'grupoPrivate');
}

function aval26Usuario(Grupo $grupo, string $email, string $nome = 'Usuário Teste', array $extra = []): Usuario
{
    return Usuario::create(array_merge([
        'grupo_id' => $grupo->id,
        'nome' => $nome,
        'email' => $email,
        'senha' => bcrypt('Senha123@'),
        'status' => UsuarioStatus::ATIVO->value,
    ], $extra));
}

function aval26Permissao(Grupo $grupo, string $chave): void
{
    $permissao = Permissao::firstOrCreate(['chave' => $chave], ['descricao' => $chave]);

    $grupo->permissoes()->syncWithoutDetaching([$permissao->id]);
}

function aval26Token(Usuario $usuario): string
{
    $sessao = UsuarioSessao::create([
        'usuario_id' => $usuario->id,
        'ativo' => true,
        'ultimo_acesso_em' => now(),
    ]);

    return JWTAuth::claims(['session_id' => $sessao->id])->fromUser($usuario);
}

// -------------------------------------------------------------------------------------------
// F-05 — /lookup/administradores
// -------------------------------------------------------------------------------------------

function aval26CenarioLookup(): array
{
    $c = aval26Cenario();

    // o lookup só lista administradores cujo grupo pode listar acessos de suporte
    aval26Permissao($c['grupoAdmin'], 'admin.acesso_suporte.listar');

    $c['admin'] = aval26Usuario($c['grupoAdmin'], 'administrador.silva@exemplo.com', 'Administrador Silva');
    $c['cliente'] = aval26Usuario($c['grupoPrivate'], 'cliente@exemplo.com', 'Cliente');

    return $c;
}

test('F-05: cliente SEM a permissão de conceder suporte não consulta administradores (403)', function () {
    $c = aval26CenarioLookup();

    $this->withHeader('Authorization', 'Bearer ' . aval26Token($c['cliente']))
        ->getJson('/api/lookup/administradores?busca=administrador')
        ->assertStatus(403);
});

test('F-05: sem token continua 401', function () {
    $this->getJson('/api/lookup/administradores?busca=administrador')->assertStatus(401);
});

test('F-05: cliente com a permissão vê a lista de administradores SEM digitar nada, com o e-mail mascarado', function () {
    $c = aval26CenarioLookup();
    aval26Permissao($c['grupoPrivate'], 'private.acesso_suporte.conceder');
    $token = aval26Token($c['cliente']);

    // o cliente não sabe quem são os administradores: a lista tem de aparecer sem busca
    foreach (['/api/lookup/administradores', '/api/lookup/administradores?busca=', '/api/lookup/administradores?busca=ad'] as $url) {
        $resposta = $this->withHeader('Authorization', "Bearer {$token}")->getJson($url)->assertOk();

        expect($resposta->json('data'))->toHaveCount(1);
        expect($resposta->json('data.0.nome'))->toBe('Administrador Silva');
        expect($resposta->json('data.0.email'))->toBe('ad***@exemplo.com');
        expect($resposta->getContent())->not->toContain('administrador.silva@exemplo.com');
    }
});

test('F-05: cliente com a permissão busca o administrador por parte do nome, com o e-mail MASCARADO', function () {
    $c = aval26CenarioLookup();
    aval26Permissao($c['grupoPrivate'], 'private.acesso_suporte.conceder');

    $resposta = $this->withHeader('Authorization', 'Bearer ' . aval26Token($c['cliente']))
        ->getJson('/api/lookup/administradores?busca=administrador')
        ->assertOk();

    expect($resposta->json('data'))->toHaveCount(1);
    expect($resposta->json('data.0.id'))->toBe($c['admin']->id);
    expect($resposta->json('data.0.nome'))->toBe('Administrador Silva');
    expect($resposta->json('data.0.email'))->toBe('ad***@exemplo.com');
    expect($resposta->getContent())->not->toContain('administrador.silva@exemplo.com');
});

test('F-05: os curingas % e _ da busca são texto (não listam todos os administradores)', function () {
    $c = aval26CenarioLookup();
    aval26Permissao($c['grupoPrivate'], 'private.acesso_suporte.conceder');
    $token = aval26Token($c['cliente']);

    foreach (['%%%', '___', '%%%%%'] as $busca) {
        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/lookup/administradores?busca=' . urlencode($busca))
            ->assertOk()
            ->assertExactJson(['data' => []]);
    }
});

test('F-05: o Admin continua listando sem busca e vê o e-mail completo', function () {
    $c = aval26CenarioLookup();

    $resposta = $this->withHeader('Authorization', 'Bearer ' . aval26Token($c['admin']))
        ->getJson('/api/lookup/administradores')
        ->assertOk();

    expect($resposta->json('data.0.email'))->toBe('administrador.silva@exemplo.com');
});

test('F-05: o Admin também não consegue usar curinga para listar tudo', function () {
    $c = aval26CenarioLookup();

    $this->withHeader('Authorization', 'Bearer ' . aval26Token($c['admin']))
        ->getJson('/api/lookup/administradores?busca=' . urlencode('%%%'))
        ->assertOk()
        ->assertExactJson(['data' => []]);
});

test('máscara de e-mail: só os 2 primeiros caracteres e o domínio', function () {
    $m = fn (string $e) => \App\Http\Resources\Lookup\Administrador\AdministradorResource::mascararEmail($e);

    expect($m('maria.souza@empresa.com'))->toBe('ma***@empresa.com');
    expect($m('a@x.com'))->toBe('a***@x.com');
    expect($m('semarroba'))->toBe('***');
    expect($m(''))->toBe('***');
});

// -------------------------------------------------------------------------------------------
// F-08 — mensagens de exceções internas
// -------------------------------------------------------------------------------------------

test('F-08: em produção a mensagem de uma RuntimeException NÃO vai ao cliente', function () {
    Route::get('/api/_teste/runtime', fn () => throw new \RuntimeException('Unable to write file at /var/www/storage/app/privado/x.pdf'));

    $this->app['env'] = 'production';

    $resposta = $this->getJson('/api/_teste/runtime')->assertStatus(400);

    expect($resposta->json('errors.business.0'))->toBe('Não foi possível processar sua solicitação.');
    expect($resposta->getContent())->not->toContain('/var/www');
});

test('F-08: fora de produção a mensagem continua visível (facilita o desenvolvimento)', function () {
    Route::get('/api/_teste/runtime', fn () => throw new \RuntimeException('detalhe para o desenvolvedor'));

    $resposta = $this->getJson('/api/_teste/runtime')->assertStatus(400);

    expect($resposta->json('errors.business.0'))->toBe('detalhe para o desenvolvedor');
});

test('F-08: erro inesperado continua genérico em produção', function () {
    Route::get('/api/_teste/erro', fn () => throw new \LogicException('segredo interno /etc/passwd'));

    $this->app['env'] = 'production';

    $resposta = $this->getJson('/api/_teste/erro')->assertStatus(500);

    expect($resposta->getContent())->not->toContain('/etc/passwd');
});

test('F-08: mensagens de regra de negócio (BusinessException) continuam chegando ao usuário', function () {
    Route::get('/api/_teste/negocio', fn () => throw new \App\Exceptions\BusinessException('Regra de negócio violada.'));

    $this->app['env'] = 'production';

    $this->getJson('/api/_teste/negocio')
        ->assertStatus(400)
        ->assertJsonPath('errors.business.0', 'Regra de negócio violada.');
});

// -------------------------------------------------------------------------------------------
// F-12 — tamanho do texto base64 antes de decodificar
// -------------------------------------------------------------------------------------------

test('F-12: o teto do texto base64 comporta o arquivo no limite (inclusive com quebras de linha) e recusa muito acima', function () {
    foreach ([2, 5, 10] as $mb) {
        $bytes = $mb * 1024 * 1024;
        $teto = LimiteBase64::maxCaracteres($bytes);

        expect(strlen(base64_encode(str_repeat('a', $bytes))))->toBeLessThanOrEqual($teto);
        expect(strlen(chunk_split(base64_encode(str_repeat('a', $bytes)))))->toBeLessThanOrEqual($teto);
        expect($teto)->toBeLessThan((int) ($bytes * 1.5)); // não é um teto frouxo
    }
});

foreach ([['admin', '/api/admin/perfil/avatar'], ['private', '/api/perfil/avatar']] as [$audiencia, $url]) {
    test("F-12: [{$audiencia}] avatar com texto base64 enorme é recusado (422) pela regra de tamanho", function () use ($audiencia, $url) {
        $c = aval26Cenario();
        $usuario = aval26Usuario($audiencia === 'admin' ? $c['grupoAdmin'] : $c['grupoPrivate'], "avatar.{$audiencia}@exemplo.com");

        $enorme = str_repeat('A', LimiteBase64::maxCaracteres(2 * 1024 * 1024) + 100);

        $this->withHeader('Authorization', 'Bearer ' . aval26Token($usuario))
            ->patchJson($url, ['avatar' => $enorme])
            ->assertStatus(422)
            ->assertJsonValidationErrors('avatar')
            ->assertJsonPath('errors.avatar.0', 'A foto de perfil deve ter no máximo 2MB.');
    });
}

// -------------------------------------------------------------------------------------------
// SEC-012 — limite de tentativas do 2FA por usuário
// -------------------------------------------------------------------------------------------

function aval26Usuario2fa(Grupo $grupo, string $email): array
{
    $google2fa = new Google2FA();
    $segredo = $google2fa->generateSecretKey();

    $usuario = aval26Usuario($grupo, $email);
    $usuario->forceFill([
        'google2fa_enable' => true,
        'google2fa_secret' => $segredo,
        'google2fa_confirmado_em' => now(),
    ])->save();

    return [$usuario, $segredo, $google2fa];
}

/** Faz o login (senha) e devolve o temp_token do 2FA. */
function aval26LoginParaTempToken($teste, string $base, string $email, ?string $ip = null): string
{
    $requisicao = $ip ? $teste->withServerVariables(['REMOTE_ADDR' => $ip]) : $teste;

    return $requisicao->postJson("{$base}/login", ['email' => $email, 'senha' => 'Senha123@'])
        ->assertOk()
        ->json('data.temp_token');
}

function aval26CodigoErrado(Google2FA $google2fa, string $segredo): string
{
    $atual = $google2fa->getCurrentOtp($segredo);

    return $atual === '000000' ? '111111' : '000000';
}

foreach ([['admin', '/api/admin'], ['private', '/api']] as [$audiencia, $base]) {
    test("SEC-012: [{$audiencia}] as falhas de um usuário NÃO bloqueiam o 2FA de um colega no mesmo IP", function () use ($audiencia, $base) {
        $c = aval26Cenario();
        $grupo = $audiencia === 'admin' ? $c['grupoAdmin'] : $c['grupoPrivate'];

        [$ana, $segredoAna, $g2faAna] = aval26Usuario2fa($grupo, "ana.{$audiencia}@exemplo.com");
        [$bia, $segredoBia, $g2faBia] = aval26Usuario2fa($grupo, "bia.{$audiencia}@exemplo.com");

        // Ana erra 9 vezes (cada token vale no máximo 5 códigos errados, então são 2 logins)
        $errado = aval26CodigoErrado($g2faAna, $segredoAna);

        $token = aval26LoginParaTempToken($this, $base, $ana->email);
        for ($i = 0; $i < 5; $i++) {
            $this->postJson("{$base}/2fa/verificar", ['temp_token' => $token, 'codigo' => $errado])->assertStatus(422);
        }

        $token = aval26LoginParaTempToken($this, $base, $ana->email);
        for ($i = 0; $i < 4; $i++) {
            $this->postJson("{$base}/2fa/verificar", ['temp_token' => $token, 'codigo' => $errado])->assertStatus(422);
        }

        // Ana está bloqueada: nem o código certo passa mais
        $this->postJson("{$base}/2fa/verificar", ['temp_token' => $token, 'codigo' => $g2faAna->getCurrentOtp($segredoAna)])
            ->assertStatus(422)
            ->assertJsonPath('errors.business.0', 'Muitas tentativas de login. Tente novamente em alguns minutos.');

        // Bia, MESMO IP, entra normalmente
        $tokenBia = aval26LoginParaTempToken($this, $base, $bia->email);
        $this->postJson("{$base}/2fa/verificar", ['temp_token' => $tokenBia, 'codigo' => $g2faBia->getCurrentOtp($segredoBia)])
            ->assertOk()
            ->assertJsonPath('data.token', fn ($t) => ! empty($t));
    });

    test("SEC-012: [{$audiencia}] o sucesso de um colega NÃO zera o contador de quem está sendo atacado", function () use ($audiencia, $base) {
        $c = aval26Cenario();
        $grupo = $audiencia === 'admin' ? $c['grupoAdmin'] : $c['grupoPrivate'];

        [$ana, $segredoAna, $g2faAna] = aval26Usuario2fa($grupo, "ana2.{$audiencia}@exemplo.com");
        [$bia, $segredoBia, $g2faBia] = aval26Usuario2fa($grupo, "bia2.{$audiencia}@exemplo.com");
        $errado = aval26CodigoErrado($g2faAna, $segredoAna);

        $token = aval26LoginParaTempToken($this, $base, $ana->email);
        for ($i = 0; $i < 5; $i++) {
            $this->postJson("{$base}/2fa/verificar", ['temp_token' => $token, 'codigo' => $errado])->assertStatus(422);
        }
        $token = aval26LoginParaTempToken($this, $base, $ana->email);
        for ($i = 0; $i < 4; $i++) {
            $this->postJson("{$base}/2fa/verificar", ['temp_token' => $token, 'codigo' => $errado])->assertStatus(422);
        }

        // Bia acerta (antes isto zerava o contador do IP e liberava o ataque a Ana)
        $tokenBia = aval26LoginParaTempToken($this, $base, $bia->email);
        $this->postJson("{$base}/2fa/verificar", ['temp_token' => $tokenBia, 'codigo' => $g2faBia->getCurrentOtp($segredoBia)])->assertOk();

        // Ana continua bloqueada
        $this->postJson("{$base}/2fa/verificar", ['temp_token' => $token, 'codigo' => $g2faAna->getCurrentOtp($segredoAna)])
            ->assertStatus(422)
            ->assertJsonPath('errors.business.0', 'Muitas tentativas de login. Tente novamente em alguns minutos.');
    });

    test("SEC-012: [{$audiencia}] o limite por usuário vale mesmo se o atacante trocar de IP a cada tentativa", function () use ($audiencia, $base) {
        $c = aval26Cenario();
        $grupo = $audiencia === 'admin' ? $c['grupoAdmin'] : $c['grupoPrivate'];

        [$ana, $segredoAna, $g2faAna] = aval26Usuario2fa($grupo, "ana3.{$audiencia}@exemplo.com");
        $errado = aval26CodigoErrado($g2faAna, $segredoAna);

        $contador = 0;
        foreach ([5, 4] as $tentativas) {
            $token = aval26LoginParaTempToken($this, $base, $ana->email, '203.0.113.' . (++$contador));

            for ($i = 0; $i < $tentativas; $i++) {
                $this->withServerVariables(['REMOTE_ADDR' => '198.51.100.' . (++$contador)])
                    ->postJson("{$base}/2fa/verificar", ['temp_token' => $token, 'codigo' => $errado])
                    ->assertStatus(422);
            }
        }

        // IP inédito, código CERTO: bloqueado pelo contador do usuário
        $this->withServerVariables(['REMOTE_ADDR' => '192.0.2.250'])
            ->postJson("{$base}/2fa/verificar", ['temp_token' => $token, 'codigo' => $g2faAna->getCurrentOtp($segredoAna)])
            ->assertStatus(422)
            ->assertJsonPath('errors.business.0', 'Muitas tentativas de login. Tente novamente em alguns minutos.');
    });

    test("SEC-012: [{$audiencia}] o acerto do PRÓPRIO usuário zera o contador dele", function () use ($audiencia, $base) {
        $c = aval26Cenario();
        $grupo = $audiencia === 'admin' ? $c['grupoAdmin'] : $c['grupoPrivate'];

        [$ana, $segredoAna, $g2faAna] = aval26Usuario2fa($grupo, "ana4.{$audiencia}@exemplo.com");
        $errado = aval26CodigoErrado($g2faAna, $segredoAna);

        $token = aval26LoginParaTempToken($this, $base, $ana->email);
        for ($i = 0; $i < 3; $i++) {
            $this->postJson("{$base}/2fa/verificar", ['temp_token' => $token, 'codigo' => $errado])->assertStatus(422);
        }
        $this->postJson("{$base}/2fa/verificar", ['temp_token' => $token, 'codigo' => $g2faAna->getCurrentOtp($segredoAna)])->assertOk();

        // depois do acerto, tem de novo o limite inteiro: 5 erros num token novo não bloqueiam
        $token = aval26LoginParaTempToken($this, $base, $ana->email);
        for ($i = 0; $i < 5; $i++) {
            $this->postJson("{$base}/2fa/verificar", ['temp_token' => $token, 'codigo' => $errado])
                ->assertStatus(422)
                ->assertJsonMissingPath('errors.business.1');
        }
    });

    test("SEC-012: [{$audiencia}] ainda existe um teto generoso por IP contra inundação de tokens inválidos", function () use ($audiencia, $base) {
        for ($i = 0; $i < 60; $i++) {
            $this->postJson("{$base}/2fa/verificar", ['temp_token' => '00000000-0000-4000-8000-' . str_pad((string) $i, 12, '0', STR_PAD_LEFT), 'codigo' => '123456'])
                ->assertStatus(422)
                ->assertJsonPath('errors.business.0', 'Token inválido ou expirado.');
        }

        $this->postJson("{$base}/2fa/verificar", ['temp_token' => '00000000-0000-4000-8000-999999999999', 'codigo' => '123456'])
            ->assertStatus(422)
            ->assertJsonPath('errors.business.0', 'Muitas tentativas de login. Tente novamente em alguns minutos.');
    });
}

// -------------------------------------------------------------------------------------------
// ESCRITÓRIO — vários usuários atrás do mesmo IP público (login e 2FA)
// -------------------------------------------------------------------------------------------

foreach ([['admin', '/api/admin'], ['private', '/api']] as [$audiencia, $base]) {
    test("ESCRITÓRIO: [{$audiencia}] 20 usuários diferentes entram no mesmo minuto, do mesmo IP, sem tomar 429", function () use ($audiencia, $base) {
        $c = aval26Cenario();
        $grupo = $audiencia === 'admin' ? $c['grupoAdmin'] : $c['grupoPrivate'];

        for ($i = 1; $i <= 20; $i++) {
            $usuario = aval26Usuario($grupo, "colega{$i}.{$audiencia}@exemplo.com", "Colega {$i}");

            // (antes: a 11ª requisição do minuto, de qualquer pessoa, recebia 429)
            $this->postJson("{$base}/login", ['email' => $usuario->email, 'senha' => 'Senha123@'])
                ->assertOk()
                ->assertJsonPath('data.token', fn ($t) => ! empty($t));
        }
    });

    test("ESCRITÓRIO: [{$audiencia}] 6 colegas com 2FA entram no mesmo minuto (12 requisições do mesmo IP)", function () use ($audiencia, $base) {
        $c = aval26Cenario();
        $grupo = $audiencia === 'admin' ? $c['grupoAdmin'] : $c['grupoPrivate'];

        for ($i = 1; $i <= 6; $i++) {
            [$usuario, $segredo, $google2fa] = aval26Usuario2fa($grupo, "dois.fatores{$i}.{$audiencia}@exemplo.com");

            $token = aval26LoginParaTempToken($this, $base, $usuario->email);

            $this->postJson("{$base}/2fa/verificar", ['temp_token' => $token, 'codigo' => $google2fa->getCurrentOtp($segredo)])
                ->assertOk();
        }
    });

    test("ESCRITÓRIO: [{$audiencia}] inundação de requisições de um mesmo IP (121 no minuto) leva 429 em português com Retry-After", function () use ($base) {
        // corpo vazio: a validação responde 422 sem tocar nos limites de falha de login
        for ($i = 1; $i <= 120; $i++) {
            expect($this->postJson("{$base}/login", [])->getStatusCode())->not->toBe(429);
        }

        $resposta = $this->postJson("{$base}/login", [])->assertStatus(429);

        expect($resposta->json('errors.business.0'))->toBe('Muitas requisições. Aguarde um instante e tente novamente.');
        expect($resposta->headers->has('Retry-After'))->toBeTrue();
    });

    test("ESCRITÓRIO: [{$audiencia}] 60 falhas de login do mesmo IP bloqueiam o IP; os acertos dos colegas não contam", function () use ($audiencia, $base) {
        $c = aval26Cenario();
        $grupo = $audiencia === 'admin' ? $c['grupoAdmin'] : $c['grupoPrivate'];

        // 20 colegas acertam: não consomem a cota de falhas
        for ($i = 1; $i <= 20; $i++) {
            $colega = aval26Usuario($grupo, "acerta{$i}.{$audiencia}@exemplo.com");
            $this->postJson("{$base}/login", ['email' => $colega->email, 'senha' => 'Senha123@'])->assertOk();
        }

        // 59 falhas (e-mails diferentes: o limite por e-mail nunca dispara; só o do IP conta)
        for ($i = 1; $i <= 59; $i++) {
            $this->postJson("{$base}/login", ['email' => "inexistente{$i}.{$audiencia}@exemplo.com", 'senha' => 'qualquer-Senha1@'])->assertStatus(401);
        }

        // ainda abaixo do limite: um colega com a senha certa entra
        $ainda = aval26Usuario($grupo, "ainda.entra.{$audiencia}@exemplo.com");
        $this->postJson("{$base}/login", ['email' => $ainda->email, 'senha' => 'Senha123@'])->assertOk();

        // a 60ª falha fecha o IP: nem a senha certa passa mais
        $this->postJson("{$base}/login", ['email' => "inexistente60.{$audiencia}@exemplo.com", 'senha' => 'qualquer-Senha1@'])->assertStatus(401);

        $bloqueado = aval26Usuario($grupo, "bloqueado.{$audiencia}@exemplo.com");
        $this->postJson("{$base}/login", ['email' => $bloqueado->email, 'senha' => 'Senha123@'])
            ->assertStatus(401)
            ->assertJsonPath('errors.business.0', 'Muitas tentativas de login. Tente novamente em alguns minutos.');
    });

    test("ESCRITÓRIO: [{$audiencia}] esqueceu-senha: o MESMO e-mail é limitado a 5 por minuto e outro e-mail do mesmo IP continua livre", function () use ($base) {
        Event::fake();

        for ($i = 1; $i <= 5; $i++) {
            expect($this->postJson("{$base}/esqueceu-senha", ['email' => 'vitima@exemplo.com'])->getStatusCode())->not->toBe(429);
        }

        $this->postJson("{$base}/esqueceu-senha", ['email' => 'vitima@exemplo.com'])->assertStatus(429);
        $this->postJson("{$base}/esqueceu-senha", ['email' => 'VITIMA@exemplo.com'])->assertStatus(429); // caixa alta não escapa

        // o limite é do e-mail, não do IP: um colega pedindo a própria redefinição não é afetado
        expect($this->postJson("{$base}/esqueceu-senha", ['email' => 'outra.pessoa@exemplo.com'])->getStatusCode())->not->toBe(429);
    });
}

test('429 de rate limit: mensagem em português, sem o texto em inglês do Laravel', function () {
    for ($i = 1; $i <= 120; $i++) {
        $this->postJson('/api/login', []);
    }

    $resposta = $this->postJson('/api/login', [])->assertStatus(429);

    expect($resposta->getContent())->not->toContain('Too Many Attempts');
});
