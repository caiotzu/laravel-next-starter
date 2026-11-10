<?php

namespace App\Support;

/**
 * Regras do `php artisan producao:verificar` (checklist de produção, docs/checklist-producao.md).
 *
 * Classe pura: recebe os valores de configuração já lidos e devolve os problemas, sem tocar em
 * banco, arquivo ou framework. Assim as regras são testáveis sem subir a aplicação, e o comando
 * fica só com a leitura da configuração e a impressão do resultado.
 */
final class VerificacaoProducao
{
    public const ERRO = 'erro';

    public const AVISO = 'aviso';

    /** Versão mínima do PHP (igual ao `require.php` do composer.json, ao CI e ao Sail). */
    public const PHP_MINIMO = '8.5.0';

    /** Senhas de banco que vêm nos exemplos do repositório (nunca servem em produção). */
    private const SENHAS_DE_EXEMPLO = ['', 'password', 'secret', 'senha', 'root', 'postgres', 'sail'];

    /**
     * @param  array<string, mixed>  $c  Chaves: php_version, app_env, app_debug, app_key, jwt_secret, app_url,
     *                                   app_url_frontend, trusted_proxies, cors_origins (array),
     *                                   swagger_generate_always, db_password, queue, cache,
     *                                   log_level, mail_host, contas_padrao (array de e-mails)
     * @return list<array{nivel: string, chave: string, mensagem: string}>
     */
    public static function analisar(array $c): array
    {
        $p = [];
        $erro = function (string $chave, string $mensagem) use (&$p): void {
            $p[] = ['nivel' => self::ERRO, 'chave' => $chave, 'mensagem' => $mensagem];
        };
        $aviso = function (string $chave, string $mensagem) use (&$p): void {
            $p[] = ['nivel' => self::AVISO, 'chave' => $chave, 'mensagem' => $mensagem];
        };

        $php = (string) ($c['php_version'] ?? '');

        if ($php !== '' && version_compare($php, self::PHP_MINIMO, '<')) {
            $erro('PHP', 'O projeto exige PHP '.self::PHP_MINIMO.' ou superior (está '.$php.').');
        }

        if (($c['app_env'] ?? null) !== 'production') {
            $erro('APP_ENV', 'Deve ser "production" (está "'.($c['app_env'] ?? '').'").');
        }

        if (self::verdadeiro($c['app_debug'] ?? false)) {
            $erro('APP_DEBUG', 'Deve ser false: com true o Laravel mostra pilhas e variáveis ao usuário.');
        }

        if (self::vazio($c['app_key'] ?? null)) {
            $erro('APP_KEY', 'Não definida. Gere com `php artisan key:generate`.');
        }

        if (self::vazio($c['jwt_secret'] ?? null)) {
            $erro('JWT_SECRET', 'Não definido. Gere com `php artisan jwt:secret`.');
        }

        foreach (['app_url' => 'APP_URL', 'app_url_frontend' => 'APP_URL_FRONTEND'] as $campo => $nome) {
            $url = (string) ($c[$campo] ?? '');

            if (! str_starts_with(strtolower($url), 'https://')) {
                $erro($nome, 'Deve usar https:// (está "'.$url.'").');
            }
        }

        self::proxies($c['trusted_proxies'] ?? null, $erro, $aviso);
        self::cors((array) ($c['cors_origins'] ?? []), $erro, $aviso);

        if (self::verdadeiro($c['swagger_generate_always'] ?? false)) {
            $erro('L5_SWAGGER_GENERATE_ALWAYS', 'Deve ser false em produção.');
        }

        $senhaBanco = (string) ($c['db_password'] ?? '');

        if (in_array(strtolower($senhaBanco), self::SENHAS_DE_EXEMPLO, true)) {
            $erro('DB_PASSWORD', 'É vazia ou é uma senha de exemplo do repositório.');
        } elseif (strlen($senhaBanco) < 16) {
            $aviso('DB_PASSWORD', 'Tem menos de 16 caracteres; use uma senha longa e aleatória.');
        }

        if (in_array($c['cache'] ?? null, ['array', 'null'], true)) {
            $erro('CACHE_STORE', 'Com "'.$c['cache'].'" os limites de requisição (rate limit) não se acumulam entre requisições. Use database ou redis.');
        }

        if (($c['queue'] ?? null) === 'sync') {
            $aviso('QUEUE_CONNECTION', 'Com "sync" auditoria e e-mails rodam dentro da requisição. Use database e mantenha o worker ativo.');
        }

        if (strtolower((string) ($c['log_level'] ?? '')) === 'debug') {
            $aviso('LOG_LEVEL', 'Em "debug" o log cresce rápido e pode registrar dados demais. Prefira warning ou error.');
        }

        if (self::vazio($c['mail_host'] ?? null) || ($c['mail_host'] ?? null) === '127.0.0.1') {
            $aviso('MAIL_HOST', 'Sem servidor SMTP real, e-mails de primeiro acesso e de redefinição de senha não saem.');
        }

        foreach ((array) ($c['contas_padrao'] ?? []) as $email) {
            $erro('CONTA_PADRAO', 'A conta de desenvolvimento "'.$email.'" existe e ainda aceita a senha do repositório. Apague-a ou troque a senha.');
        }

        return $p;
    }

    /** `true` se algum problema for do nível erro. */
    public static function temErro(array $problemas): bool
    {
        foreach ($problemas as $problema) {
            if ($problema['nivel'] === self::ERRO) {
                return true;
            }
        }

        return false;
    }

    private static function proxies(mixed $valor, callable $erro, callable $aviso): void
    {
        $texto = is_array($valor) ? implode(',', $valor) : trim((string) $valor);

        if ($texto === '') {
            $erro('TRUSTED_PROXIES', 'Vazio: o Laravel enxerga o IP do servidor Next.js e TODOS os usuários dividem a mesma cota de limite de requisições (login, 2FA e API).');

            return;
        }

        if ($texto === '*' || $texto === '**') {
            $aviso('TRUSTED_PROXIES', '"'.$texto.'" só é aceitável se a API NÃO for acessível pela internet (apenas pelo Next.js/rede privada). Prefira o IP ou a faixa (CIDR) do servidor Next.js.');
        }
    }

    /** @param  list<string>  $origens */
    private static function cors(array $origens, callable $erro, callable $aviso): void
    {
        if ($origens === []) {
            $erro('CORS_ALLOWED_ORIGINS', 'Vazio. Informe a origem pública do frontend.');

            return;
        }

        foreach ($origens as $origem) {
            $origem = trim((string) $origem);

            if ($origem === '*') {
                $erro('CORS_ALLOWED_ORIGINS', 'Contém "*": qualquer site poderia chamar a API pelo navegador.');
            } elseif (preg_match('#^https?://(localhost|127\.0\.0\.1)(:\d+)?$#i', $origem) === 1) {
                $aviso('CORS_ALLOWED_ORIGINS', 'Contém a origem de desenvolvimento "'.$origem.'".');
            } elseif (! str_starts_with(strtolower($origem), 'https://')) {
                $aviso('CORS_ALLOWED_ORIGINS', 'A origem "'.$origem.'" não usa https://.');
            }
        }
    }

    private static function vazio(mixed $valor): bool
    {
        return trim((string) $valor) === '';
    }

    private static function verdadeiro(mixed $valor): bool
    {
        return filter_var($valor, FILTER_VALIDATE_BOOLEAN);
    }
}
