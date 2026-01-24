<?php

namespace Database\Seeders;

use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class PrivatePermissaoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table("permissoes")->insert([
            [
                "id" => Str::uuid(),
                "chave" => "private.usuario.menu",
                "descricao" => "Permite visualizar o menu de usuários",
                "created_at" => date("Y-m-d H:i:s"),
                "updated_at" => date("Y-m-d H:i:s")
            ],
            [
                "id" => Str::uuid(),
                "chave" => "private.usuario.listar",
                "descricao" => "Permite visualizar a listagem de usuários",
                "created_at" => date("Y-m-d H:i:s"),
                "updated_at" => date("Y-m-d H:i:s")
            ],
            [
                "id" => Str::uuid(),
                "chave" => "private.usuario.criar",
                "descricao" => "Permite cadastrar um novo usuário",
                "created_at" => date("Y-m-d H:i:s"),
                "updated_at" => date("Y-m-d H:i:s")
            ],
            [
                "id" => Str::uuid(),
                "chave" => "private.usuario.editar",
                "descricao" => "Permite editar um usuário já cadastrado",
                "created_at" => date("Y-m-d H:i:s"),
                "updated_at" => date("Y-m-d H:i:s")
            ]
        ]);
    }
}
