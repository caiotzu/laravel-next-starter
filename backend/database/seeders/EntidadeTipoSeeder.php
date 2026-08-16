<?php

namespace Database\Seeders;

use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class EntidadeTipoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $entidadeTipos = [
            ["chave" => "admin", "entidade_tabela" => null],
            ["chave" => "private", "entidade_tabela" => "grupo_empresas"],
        ];

        $chavesExistentes = DB::table("entidade_tipos")
            ->whereIn("chave", array_column($entidadeTipos, "chave"))
            ->pluck("chave")
            ->all();

        foreach ($entidadeTipos as $entidadeTipo) {
            if (in_array($entidadeTipo["chave"], $chavesExistentes, true)) {
                continue;
            }

            DB::table("entidade_tipos")->insert([
                "id" => Str::uuid(),
                "chave" => $entidadeTipo["chave"],
                "entidade_tabela" => $entidadeTipo["entidade_tabela"],
                "created_at" => date("Y-m-d H:i:s"),
                "updated_at" => date("Y-m-d H:i:s")
            ]);
        }
    }
}
