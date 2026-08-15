<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

/**
 * Gera o hash de senha a ser colocado em SWAGGER_ADMIN_PASSWORD_HASH no
 * .env, usado pelo middleware App\Http\Middleware\SwaggerAdminAuth para
 * proteger a documentação Swagger da área Admin.
 */
class SwaggerAdminHashCommand extends Command
{
    protected $signature = 'swagger:admin-hash {senha? : Senha em texto puro (se omitida, será solicitada de forma oculta)}';

    protected $description = 'Gera o hash de senha para proteger a documentação Swagger Admin (SWAGGER_ADMIN_PASSWORD_HASH)';

    public function handle(): int
    {
        $senha = $this->argument('senha') ?? $this->secret('Informe a senha para o acesso ao Swagger Admin');

        if (blank($senha)) {
            $this->error('A senha não pode ser vazia.');

            return self::FAILURE;
        }

        $this->newLine();
        $this->line('Adicione ao seu .env:');
        $this->newLine();
        $this->line('SWAGGER_ADMIN_USERNAME=admin');
        $this->line('SWAGGER_ADMIN_PASSWORD_HASH="'.Hash::make($senha).'"');
        $this->newLine();

        return self::SUCCESS;
    }
}
