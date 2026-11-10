<?php

/**
 * Comandos de produção: `producao:verificar` (checklist) e `admin:criar-inicial` (primeiro admin
 * com senha escolhida, no lugar das contas de desenvolvimento com senha pública).
 */

use Database\Seeders\AdminGrupoSeeder;
use Database\Seeders\EntidadeTipoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

const PERGUNTA_SENHA_ADMIN = 'Senha (mín. 8, com maiúsculas, minúsculas, números e símbolos)';
const PERGUNTA_CONFIRMACAO_ADMIN = 'Confirme a senha';

function configurarProducaoValida(array $sobrescrever = []): void
{
    config(array_merge([
        'app.env' => 'production',
        'app.debug' => false,
        'app.key' => 'base64:chave-de-teste',
        'jwt.secret' => 'segredo-de-teste',
        'app.url' => 'https://api.exemplo.com.br',
        'app.url_frontend' => 'https://app.exemplo.com.br',
        'trustedproxy.proxies' => '10.0.0.5',
        'cors.allowed_origins' => ['https://app.exemplo.com.br'],
        'l5-swagger.defaults.generate_always' => false,
        'database.connections.'.config('database.default').'.password' => str_repeat('a', 24),
        'queue.default' => 'database',
        'cache.default' => 'database',
        'logging.channels.single.level' => 'warning',
        'mail.mailers.smtp.host' => 'smtp.exemplo.com.br',
    ], $sobrescrever));
}

function prepararGrupoAdmin(): void
{
    test()->seed(EntidadeTipoSeeder::class);
    test()->seed(AdminGrupoSeeder::class);
}

describe('producao:verificar', function () {
    it('sai com sucesso quando a configuração está correta', function () {
        configurarProducaoValida();

        $this->artisan('producao:verificar', ['--sem-banco' => true])
            ->expectsOutputToContain('Tudo certo')
            ->assertExitCode(0);
    });

    it('falha e aponta TRUSTED_PROXIES vazio', function () {
        configurarProducaoValida(['trustedproxy.proxies' => null]);

        $this->artisan('producao:verificar', ['--sem-banco' => true])
            ->expectsOutputToContain('TRUSTED_PROXIES')
            ->assertExitCode(1);
    });

    it('falha fora de produção (APP_ENV=testing)', function () {
        configurarProducaoValida(['app.env' => 'testing']);

        $this->artisan('producao:verificar', ['--sem-banco' => true])
            ->expectsOutputToContain('APP_ENV')
            ->assertExitCode(1);
    });

    it('só avisos não falham o comando', function () {
        configurarProducaoValida(['trustedproxy.proxies' => '*']);

        $this->artisan('producao:verificar', ['--sem-banco' => true])
            ->expectsOutputToContain('TRUSTED_PROXIES')
            ->assertExitCode(0);
    });

    it('acusa a conta de desenvolvimento que ainda aceita a senha pública', function () {
        configurarProducaoValida();
        prepararGrupoAdmin();

        $grupoId = DB::table('grupos')->where('descricao', 'Desenvolvimento')->value('id');

        DB::table('usuarios')->insert([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'grupo_id' => $grupoId,
            'nome' => 'Dev',
            'email' => 'admin@admin.com.br',
            'senha' => Hash::make('Admin123@'),
            'status' => 'ativo',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->artisan('producao:verificar')
            ->expectsOutputToContain('admin@admin.com.br')
            ->assertExitCode(1);
    });

    it('não acusa a conta de desenvolvimento cuja senha já foi trocada', function () {
        configurarProducaoValida();
        prepararGrupoAdmin();

        $grupoId = DB::table('grupos')->where('descricao', 'Desenvolvimento')->value('id');

        DB::table('usuarios')->insert([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'grupo_id' => $grupoId,
            'nome' => 'Dev',
            'email' => 'admin@admin.com.br',
            'senha' => Hash::make('Outra#Senha2026'),
            'status' => 'ativo',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->artisan('producao:verificar')->assertExitCode(0);
    });
});

describe('admin:criar-inicial', function () {
    it('cria o administrador no grupo Admin com a senha informada (hash, nunca em texto)', function () {
        prepararGrupoAdmin();

        $this->artisan('admin:criar-inicial', ['email' => 'Maria@Empresa.com.br', '--nome' => 'Maria Silva'])
            ->expectsQuestion(PERGUNTA_SENHA_ADMIN, 'Segura#2026x')
            ->expectsQuestion(PERGUNTA_CONFIRMACAO_ADMIN, 'Segura#2026x')
            ->assertExitCode(0);

        $usuario = DB::table('usuarios')->where('email', 'maria@empresa.com.br')->first();

        expect($usuario)->not->toBeNull();
        expect($usuario->nome)->toBe('Maria Silva');
        expect($usuario->status)->toBe('ativo');
        expect($usuario->senha)->not->toBe('Segura#2026x');
        expect(Hash::check('Segura#2026x', $usuario->senha))->toBeTrue();
        expect($usuario->grupo_id)->toBe(DB::table('grupos')->where('descricao', 'Desenvolvimento')->value('id'));
    });

    it('recusa senha fraca e não cria o usuário', function () {
        prepararGrupoAdmin();

        $this->artisan('admin:criar-inicial', ['email' => 'maria@empresa.com.br', '--nome' => 'Maria Silva'])
            ->expectsQuestion(PERGUNTA_SENHA_ADMIN, 'fraca')
            ->expectsQuestion(PERGUNTA_CONFIRMACAO_ADMIN, 'fraca')
            ->assertExitCode(1);

        expect(DB::table('usuarios')->where('email', 'maria@empresa.com.br')->exists())->toBeFalse();
    });

    it('recusa a senha de exemplo do repositório', function () {
        prepararGrupoAdmin();

        $this->artisan('admin:criar-inicial', ['email' => 'maria@empresa.com.br', '--nome' => 'Maria Silva'])
            ->expectsQuestion(PERGUNTA_SENHA_ADMIN, 'Admin123@')
            ->expectsQuestion(PERGUNTA_CONFIRMACAO_ADMIN, 'Admin123@')
            ->assertExitCode(1);

        expect(DB::table('usuarios')->count())->toBe(0);
    });

    it('recusa quando as senhas não conferem', function () {
        prepararGrupoAdmin();

        $this->artisan('admin:criar-inicial', ['email' => 'maria@empresa.com.br', '--nome' => 'Maria Silva'])
            ->expectsQuestion(PERGUNTA_SENHA_ADMIN, 'Segura#2026x')
            ->expectsQuestion(PERGUNTA_CONFIRMACAO_ADMIN, 'Segura#2026y')
            ->assertExitCode(1);

        expect(DB::table('usuarios')->count())->toBe(0);
    });

    it('recusa o e-mail das contas de desenvolvimento', function () {
        prepararGrupoAdmin();

        $this->artisan('admin:criar-inicial', ['email' => 'admin@admin.com.br', '--nome' => 'Maria Silva'])
            ->assertExitCode(1);

        expect(DB::table('usuarios')->count())->toBe(0);
    });

    it('recusa e-mail já cadastrado', function () {
        prepararGrupoAdmin();

        $grupoId = DB::table('grupos')->where('descricao', 'Desenvolvimento')->value('id');

        DB::table('usuarios')->insert([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'grupo_id' => $grupoId,
            'nome' => 'Existente',
            'email' => 'maria@empresa.com.br',
            'senha' => Hash::make('Outra#Senha2026'),
            'status' => 'ativo',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->artisan('admin:criar-inicial', ['email' => 'maria@empresa.com.br', '--nome' => 'Maria Silva'])
            ->assertExitCode(1);

        expect(DB::table('usuarios')->count())->toBe(1);
    });

    it('avisa para rodar o ProducaoSeeder quando o grupo Admin não existe', function () {
        $this->artisan('admin:criar-inicial', ['email' => 'maria@empresa.com.br', '--nome' => 'Maria Silva'])
            ->expectsOutputToContain('ProducaoSeeder')
            ->assertExitCode(1);
    });
});
