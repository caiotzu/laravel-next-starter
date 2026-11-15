<?php

namespace App\Console\Commands;

use App\Support\ApiDocsUi;
use Illuminate\Console\Command;

/**
 * Gera a documentação OpenAPI e escolhe a interface que a exibe: Swagger UI (l5-swagger,
 * como sempre foi) ou Scalar. As duas leem o mesmo JSON, e as URLs não mudam.
 *
 *   php artisan api-docs:gerar            regera o JSON e mantém a interface atual
 *   php artisan api-docs:gerar swagger    regera o JSON e passa a exibir o Swagger UI
 *   php artisan api-docs:gerar scalar     regera o JSON e passa a exibir o Scalar
 *   php artisan api-docs:gerar scalar --sem-gerar   só troca a interface
 *
 * A escolha é gravada em API_DOCS_UI no .env. Em produção o comando não altera o .env:
 * defina API_DOCS_UI no ambiente.
 */
class ApiDocsGerarCommand extends Command
{
    protected $signature = 'api-docs:gerar
        {ui? : Interface da documentação: swagger ou scalar (se omitida, mantém a atual)}
        {--sem-gerar : Só troca a interface, sem regerar o JSON da documentação}';

    protected $description = 'Gera a documentação da API (l5-swagger) e escolhe a interface: Swagger UI ou Scalar';

    public function handle(): int
    {
        $ui = $this->argument('ui');

        if ($ui !== null) {
            $ui = strtolower(trim((string) $ui));

            if (! in_array($ui, ApiDocsUi::OPCOES, true)) {
                $this->components->error('Interface inválida "'.$ui.'". Use: '.implode(' ou ', ApiDocsUi::OPCOES).'.');

                return self::FAILURE;
            }

            if (app()->isProduction()) {
                $this->components->error('Em produção o comando não altera o .env. Defina API_DOCS_UI='.$ui.' nas variáveis de ambiente.');

                return self::FAILURE;
            }

            if (! $this->gravarNoEnv($ui)) {
                return self::FAILURE;
            }

            config(['api_docs.ui' => $ui]);
        }

        if (! $this->option('sem-gerar')) {
            $this->components->info('Gerando o JSON da documentação (l5-swagger)...');

            if ($this->call('l5-swagger:generate', ['--all' => true]) !== self::SUCCESS) {
                $this->components->error('Não foi possível gerar a documentação.');

                return self::FAILURE;
            }
        }

        $this->resumo();

        return self::SUCCESS;
    }

    private function gravarNoEnv(string $ui): bool
    {
        $arquivo = $this->laravel->environmentFilePath();

        if (! is_file($arquivo) || ! is_writable($arquivo)) {
            $this->components->error('Não foi possível alterar o arquivo .env. Defina manualmente: API_DOCS_UI='.$ui);

            return false;
        }

        $atual = (string) file_get_contents($arquivo);

        if (file_put_contents($arquivo, ApiDocsUi::atualizarEnv($atual, $ui)) === false) {
            $this->components->error('Falha ao gravar o arquivo .env. Defina manualmente: API_DOCS_UI='.$ui);

            return false;
        }

        // Evita que uma configuração em cache continue apontando para a interface antiga.
        $this->callSilently('config:clear');

        $this->components->info('API_DOCS_UI='.$ui.' gravado no .env.');

        return true;
    }

    private function resumo(): void
    {
        $this->newLine();
        $this->components->twoColumnDetail('Interface ativa', strtoupper(ApiDocsUi::ativa()));
        $this->components->twoColumnDetail('Documentação pública', route('l5-swagger.default.api'));
        $this->components->twoColumnDetail('Documentação Admin', route('l5-swagger.admin.api').' (HTTP Basic)');
        $this->newLine();
    }
}
