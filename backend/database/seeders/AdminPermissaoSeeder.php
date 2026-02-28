<?php

namespace Database\Seeders;

use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class AdminPermissaoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table("permissoes")->insert([
            // grupo empresa
                [
                    "id" => Str::uuid(),
                    "chave" => "admin.grupo_empresa.menu",
                    "descricao" => "Permite visualizar o menu de grupos de empresas",
                    "created_at" => date("Y-m-d H:i:s"),
                    "updated_at" => date("Y-m-d H:i:s")
                ],
                [
                    "id" => Str::uuid(),
                    "chave" => "admin.grupo_empresa.cadastrar",
                    "descricao" => "Permite cadastrar um novo grupo de empresas",
                    "created_at" => date("Y-m-d H:i:s"),
                    "updated_at" => date("Y-m-d H:i:s")
                ],
                [
                    "id" => Str::uuid(),
                    "chave" => "admin.grupo_empresa.atualizar",
                    "descricao" => "Permite atualizar um grupo de empresas",
                    "created_at" => date("Y-m-d H:i:s"),
                    "updated_at" => date("Y-m-d H:i:s")
                ],
                [
                    "id" => Str::uuid(),
                    "chave" => "admin.grupo_empresa.visualizar",
                    "descricao" => "Permite visualizar um grupo de empresas",
                    "created_at" => date("Y-m-d H:i:s"),
                    "updated_at" => date("Y-m-d H:i:s")
                ],
                [
                    "id" => Str::uuid(),
                    "chave" => "admin.grupo_empresa.excluir",
                    "descricao" => "Permite excluir um grupo de empresas",
                    "created_at" => date("Y-m-d H:i:s"),
                    "updated_at" => date("Y-m-d H:i:s")
                ],
                [
                    "id" => Str::uuid(),
                    "chave" => "admin.grupo_empresa.ativar",
                    "descricao" => "Permite ativar um grupo de empresas",
                    "created_at" => date("Y-m-d H:i:s"),
                    "updated_at" => date("Y-m-d H:i:s")
                ],
                [
                    "id" => Str::uuid(),
                    "chave" => "admin.grupo_empresa.listar",
                    "descricao" => "Permite listar os grupos de empresas",
                    "created_at" => date("Y-m-d H:i:s"),
                    "updated_at" => date("Y-m-d H:i:s")
                ],
            //---

            // grupo empresa
                [
                    "id" => Str::uuid(),
                    "chave" => "admin.empresa.menu",
                    "descricao" => "Permite visualizar o menu de empresas",
                    "created_at" => date("Y-m-d H:i:s"),
                    "updated_at" => date("Y-m-d H:i:s")
                ],
                [
                    "id" => Str::uuid(),
                    "chave" => "admin.empresa.cadastrar",
                    "descricao" => "Permite cadastrar uma nova empresa",
                    "created_at" => date("Y-m-d H:i:s"),
                    "updated_at" => date("Y-m-d H:i:s")
                ],
                [
                    "id" => Str::uuid(),
                    "chave" => "admin.empresa.atualizar",
                    "descricao" => "Permite atualizar uma empresa",
                    "created_at" => date("Y-m-d H:i:s"),
                    "updated_at" => date("Y-m-d H:i:s")
                ],
                [
                    "id" => Str::uuid(),
                    "chave" => "admin.empresa.visualizar",
                    "descricao" => "Permite visualizar uma empresa",
                    "created_at" => date("Y-m-d H:i:s"),
                    "updated_at" => date("Y-m-d H:i:s")
                ],
                [
                    "id" => Str::uuid(),
                    "chave" => "admin.empresa.excluir",
                    "descricao" => "Permite excluir uma empresa",
                    "created_at" => date("Y-m-d H:i:s"),
                    "updated_at" => date("Y-m-d H:i:s")
                ],
                [
                    "id" => Str::uuid(),
                    "chave" => "admin.empresa.ativar",
                    "descricao" => "Permite ativar uma empresa",
                    "created_at" => date("Y-m-d H:i:s"),
                    "updated_at" => date("Y-m-d H:i:s")
                ],
                [
                    "id" => Str::uuid(),
                    "chave" => "admin.empresa.listar",
                    "descricao" => "Permite listar as empresas",
                    "created_at" => date("Y-m-d H:i:s"),
                    "updated_at" => date("Y-m-d H:i:s")
                ],
            //---
        ]);
    }
}
