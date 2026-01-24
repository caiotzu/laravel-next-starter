<?php

namespace Database\Seeders;

use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;


class PrivateGrupoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $entidadeTipo = DB::table("entidade_tipos")->where("chave", "private")->first();
        $empresa = DB::table("empresas")->where("cnpj", "12345678000190")->first();

        DB::table("grupos")->insert([
            "id" => Str::uuid(),
            "descricao" => "Administração",
            "entidade_tipo_id" => $entidadeTipo->id,
            "entidade_id" => $empresa->id,
            "created_at" => date("Y-m-d H:i:s"),
            "updated_at" => date("Y-m-d H:i:s")
        ]);
    }
}
