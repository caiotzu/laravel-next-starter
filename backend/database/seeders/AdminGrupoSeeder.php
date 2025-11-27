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
        $entidadeTipo = DB::table('entidade_tipos')->where('chave', 'admin')->first();

        DB::table("grupos")->insert([
            'id' => Str::uuid(),
            "descricao" => "Desenvolvimento",
            "entidade_tipo_id" => $entidadeTipo->id,
            "entidade_id" => null
        ]);
    }
}
