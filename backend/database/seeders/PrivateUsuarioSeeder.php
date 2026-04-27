<?php

namespace Database\Seeders;

use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

use App\Enums\UsuarioStatus;

class PrivateUsuarioSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $grupo = DB::table("grupos")->where("descricao", "Administrador")->orderBy("created_at")->first();

        DB::table("usuarios")->insert([
            "id" => Str::uuid(),
            "grupo_id" => $grupo->id,
            "nome" => "Caio Costa",
            "email" => "private@private.com.br",
            "senha" => bcrypt("Private123@"),
            "status" => UsuarioStatus::ATIVO->value,
            "created_at" => date("Y-m-d H:i:s"),
            "updated_at" => date("Y-m-d H:i:s")
        ]);
    }
}
