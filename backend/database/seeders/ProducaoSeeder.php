<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Dados MÍNIMOS para um ambiente de produção novo: catálogos, permissões e o grupo Admin.
 *
 * NÃO cria usuários, empresas nem senhas: o `DatabaseSeeder` é de desenvolvimento e publica contas
 * com senha conhecida (admin@admin.com.br / private@private.com.br). O primeiro administrador é
 * criado à parte, com senha escolhida por você: `php artisan admin:criar-inicial`.
 *
 * Rodar UMA vez, em banco recém-migrado (`php artisan db:seed --class=ProducaoSeeder --force`).
 * Os seeders de catálogo não são reentrantes; a guarda abaixo impede duplicar dados.
 */
class ProducaoSeeder extends Seeder
{
    public function run(): void
    {
        if (DB::table('entidade_tipos')->exists()) {
            throw new RuntimeException('O banco já tem dados de catálogo (entidade_tipos). O ProducaoSeeder só roda uma vez, em banco recém-migrado.');
        }

        $this->call([
            MunicipioSeeder::class,
            EntidadeTipoSeeder::class,
            AdminPermissaoSeeder::class,
            AdminGrupoSeeder::class,
            AdminGrupoPermissaoSeeder::class,
            PrivatePermissaoSeeder::class,
        ]);
    }
}
