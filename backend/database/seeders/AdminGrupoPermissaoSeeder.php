<?php

namespace Database\Seeders;

use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;


class AdminGrupoPermissaoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $grupo = DB::table('grupos')->where('descricao', 'Desenvolvimento')->first();
        $permissoes = DB::table('permissoes')->where('chave', 'like', 'admin.%')->get();
        $grupoPermissoes = [];

        foreach($permissoes as $permissao) {
          array_push($grupoPermissoes, [
            'id' => Str::uuid(),
            'grupo_id' => $grupo->id,
            'permissao_id' => $permissao->id
          ]);
        }

        DB::table("grupo_permissoes")->insert($grupoPermissoes);
    }
}
