<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            MunicipioSeeder::class,

            EntidadeTipoSeeder::class,
            AdminPermissaoSeeder::class,
            AdminGrupoSeeder::class,
            AdminGrupoPermissaoSeeder::class,
            AdminUsuarioSeeder::class,

            PrivatePermissaoSeeder::class,
            PrivateGrupoEmpresaSeeder::class,
            PrivateEmpresaSeeder::class,
            PrivateEmpresaEnderecoSeeder::class,
            PrivateEmpresaContatoSeeder::class,
            PrivateGrupoSeeder::class,
            PrivateGrupoPermissaoSeeder::class,
            PrivateUsuarioSeeder::class
        ]);
    }
}
