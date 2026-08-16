<?php

namespace Database\Seeders;

use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;


class AdminGrupoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $entidadeTipo = DB::table("entidade_tipos")->where("chave", "admin")->first();

        $existe = DB::table("grupos")
            ->where("descricao", "Desenvolvimento")
            ->where("entidade_tipo_id", $entidadeTipo->id)
            ->whereNull("entidade_id")
            ->exists();

        if ($existe) {
            return;
        }

        DB::table("grupos")->insert([
            "id" => Str::uuid(),
            "descricao" => "Desenvolvimento",
            "entidade_tipo_id" => $entidadeTipo->id,
            "entidade_id" => null,
            "created_at" => date("Y-m-d H:i:s"),
            "updated_at" => date("Y-m-d H:i:s")
        ]);
    }
}
