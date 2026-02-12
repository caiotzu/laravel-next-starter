<?php

namespace Database\Seeders;

use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;


class PrivateGrupoPermissaoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $grupo = DB::table("grupos")->where("descricao", "Administrador")->first();
        $permissoes = DB::table("permissoes")->where("chave", "like", "private.%")->get();
        $grupoPermissoes = [];

        foreach($permissoes as $permissao) {
            array_push($grupoPermissoes, [
                "grupo_id" => $grupo->id,
                "permissao_id" => $permissao->id,
                "created_at" => date("Y-m-d H:i:s"),
                "updated_at" => date("Y-m-d H:i:s")
            ]);
        }

        DB::table("grupo_permissoes")->insert($grupoPermissoes);
    }
}
