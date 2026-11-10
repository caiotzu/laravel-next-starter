<?php

namespace App\Console\Commands;

use App\Support\VerificacaoProducao;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Throwable;

/**
 * Confere a configuração do servidor contra o docs/checklist-producao.md.
 *
 * Só lê (configuração e uma consulta ao banco); não altera nada. Rode no servidor de produção,
 * depois de `config:cache` (lê a configuração que a aplicação realmente usa).
 */
class VerificarProducaoCommand extends Command
{
    protected $signature = 'producao:verificar {--sem-banco : Não consulta o banco (pula a checagem de contas de desenvolvimento)}';

    protected $description = 'Confere a configuração de produção (APP_ENV, TRUSTED_PROXIES, CORS, segredos, contas de desenvolvimento)';

    /** Contas criadas pelos seeders de desenvolvimento, com a senha que o repositório publica. */
    private const CONTAS_PADRAO = [
        'admin@admin.com.br' => 'Admin123@',
        'private@private.com.br' => 'Private123@',
    ];

    public function handle(): int
    {
        $problemas = VerificacaoProducao::analisar([
            'php_version' => PHP_VERSION,
            'app_env' => config('app.env'),
            'app_debug' => config('app.debug'),
            'app_key' => config('app.key'),
            'jwt_secret' => config('jwt.secret'),
            'app_url' => config('app.url'),
            'app_url_frontend' => config('app.url_frontend'),
            'trusted_proxies' => config('trustedproxy.proxies'),
            'cors_origins' => config('cors.allowed_origins'),
            'swagger_generate_always' => config('l5-swagger.defaults.generate_always'),
            'db_password' => config('database.connections.'.config('database.default').'.password'),
            'queue' => config('queue.default'),
            'cache' => config('cache.default'),
            'log_level' => config('logging.channels.single.level'),
            'mail_host' => config('mail.mailers.smtp.host'),
            'contas_padrao' => $this->option('sem-banco') ? [] : $this->contasPadraoAtivas(),
        ]);

        if ($problemas === []) {
            $this->info('Tudo certo: nenhum problema encontrado.');

            return self::SUCCESS;
        }

        foreach ($problemas as $problema) {
            $linha = sprintf('[%s] %s: %s', strtoupper($problema['nivel']), $problema['chave'], $problema['mensagem']);

            $problema['nivel'] === VerificacaoProducao::ERRO ? $this->error($linha) : $this->warn($linha);
        }

        $this->newLine();

        if (VerificacaoProducao::temErro($problemas)) {
            $this->error('Há erros: corrija antes de publicar.');

            return self::FAILURE;
        }

        $this->warn('Só avisos: leia cada um e decida conscientemente.');

        return self::SUCCESS;
    }

    /**
     * E-mails das contas de desenvolvimento que ainda existem E ainda aceitam a senha pública.
     * Conta que já teve a senha trocada não é problema (e não é listada).
     *
     * @return list<string>
     */
    private function contasPadraoAtivas(): array
    {
        try {
            $ativas = [];

            foreach (self::CONTAS_PADRAO as $email => $senha) {
                $hash = DB::table('usuarios')->where('email', $email)->value('senha');

                if (is_string($hash) && $hash !== '' && Hash::check($senha, $hash)) {
                    $ativas[] = $email;
                }
            }

            return $ativas;
        } catch (Throwable $e) {
            $this->warn('Não foi possível consultar o banco ('.get_class($e).'); a checagem de contas de desenvolvimento foi pulada.');

            return [];
        }
    }
}
