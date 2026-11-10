<?php

namespace App\Console\Commands;

use App\Enums\UsuarioStatus;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

/**
 * Cria o primeiro administrador de um ambiente de produção, com a senha que VOCÊ escolhe.
 *
 * Existe porque o `DatabaseSeeder` só cria contas de desenvolvimento com senha pública. Depois
 * de `php artisan db:seed --class=ProducaoSeeder --force`, rode este comando uma vez.
 * A senha é pedida de forma oculta (nunca vai para o histórico do shell nem para o log).
 */
class CriarAdminInicialCommand extends Command
{
    protected $signature = 'admin:criar-inicial {email : E-mail de acesso do administrador} {--nome= : Nome completo (se omitido, será solicitado)}';

    protected $description = 'Cria o primeiro administrador (grupo Desenvolvimento) com senha informada de forma oculta';

    /** E-mails e senhas das contas de desenvolvimento publicadas no repositório. */
    private const EMAILS_PROIBIDOS = ['admin@admin.com.br', 'private@private.com.br'];

    private const SENHAS_PROIBIDAS = ['Admin123@', 'Private123@'];

    public function handle(): int
    {
        $email = strtolower(trim((string) $this->argument('email')));
        $nome = trim((string) ($this->option('nome') ?: $this->ask('Nome completo')));

        if (in_array($email, self::EMAILS_PROIBIDOS, true)) {
            $this->error('Use um e-mail real, não o das contas de desenvolvimento.');

            return self::FAILURE;
        }

        $validacao = Validator::make(
            ['email' => $email, 'nome' => $nome],
            ['email' => ['required', 'email', 'max:255'], 'nome' => ['required', 'string', 'min:3', 'max:255']]
        );

        if ($validacao->fails()) {
            foreach ($validacao->errors()->all() as $mensagem) {
                $this->error($mensagem);
            }

            return self::FAILURE;
        }

        if (DB::table('usuarios')->where('email', $email)->exists()) {
            $this->error('Já existe um usuário com este e-mail.');

            return self::FAILURE;
        }

        $grupoId = DB::table('grupos')
            ->join('entidade_tipos', 'entidade_tipos.id', '=', 'grupos.entidade_tipo_id')
            ->where('entidade_tipos.chave', 'admin')
            ->where('grupos.descricao', 'Desenvolvimento')
            ->whereNull('grupos.entidade_id')
            ->value('grupos.id');

        if (! $grupoId) {
            $this->error('Grupo Admin não encontrado. Rode antes: php artisan db:seed --class=ProducaoSeeder --force');

            return self::FAILURE;
        }

        $senha = (string) $this->secret('Senha (mín. 8, com maiúsculas, minúsculas, números e símbolos)');
        $confirmacao = (string) $this->secret('Confirme a senha');

        if ($senha !== $confirmacao) {
            $this->error('As senhas não conferem.');

            return self::FAILURE;
        }

        $regras = Validator::make(
            ['senha' => $senha],
            ['senha' => ['required', Password::min(8)->mixedCase()->letters()->numbers()->symbols()]]
        );

        if ($regras->fails() || in_array($senha, self::SENHAS_PROIBIDAS, true)) {
            $this->error('Senha fraca: use no mínimo 8 caracteres com maiúsculas, minúsculas, números e símbolos, e não a senha de exemplo.');

            return self::FAILURE;
        }

        DB::table('usuarios')->insert([
            'id' => (string) Str::uuid(),
            'grupo_id' => $grupoId,
            'nome' => $nome,
            'email' => $email,
            'senha' => Hash::make($senha),
            'status' => UsuarioStatus::ATIVO->value,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->info('Administrador criado: '.$email);

        return self::SUCCESS;
    }
}
