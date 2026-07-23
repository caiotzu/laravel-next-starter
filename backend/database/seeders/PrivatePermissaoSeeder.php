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
            // empresa
                [
                    "id" => Str::uuid(),
                    "chave" => "private.empresa.menu",
                    "descricao" => "Permite visualizar o menu de empresas",
                    "created_at" => date("Y-m-d H:i:s"),
                    "updated_at" => date("Y-m-d H:i:s")
                ],
                [
                    "id" => Str::uuid(),
                    "chave" => "private.empresa.atualizar",
                    "descricao" => "Permite atualizar uma empresa",
                    "created_at" => date("Y-m-d H:i:s"),
                    "updated_at" => date("Y-m-d H:i:s")
                ],
                [
                    "id" => Str::uuid(),
                    "chave" => "private.empresa.visualizar",
                    "descricao" => "Permite visualizar uma empresa",
                    "created_at" => date("Y-m-d H:i:s"),
                    "updated_at" => date("Y-m-d H:i:s")
                ],
                [
                    "id" => Str::uuid(),
                    "chave" => "private.empresa.listar",
                    "descricao" => "Permite listar as empresas",
                    "created_at" => date("Y-m-d H:i:s"),
                    "updated_at" => date("Y-m-d H:i:s")
                ],
            //---

            // empresa contato
                [
                    "id" => Str::uuid(),
                    "chave" => "private.empresa.contato.cadastrar",
                    "descricao" => "Permite cadastrar um novo contato para empresa",
                    "created_at" => date("Y-m-d H:i:s"),
                    "updated_at" => date("Y-m-d H:i:s")
                ],
                [
                    "id" => Str::uuid(),
                    "chave" => "private.empresa.contato.atualizar",
                    "descricao" => "Permite atualizar o contato de uma empresa",
                    "created_at" => date("Y-m-d H:i:s"),
                    "updated_at" => date("Y-m-d H:i:s")
                ],
                [
                    "id" => Str::uuid(),
                    "chave" => "private.empresa.contato.visualizar",
                    "descricao" => "Permite visualizar o contato de uma empresa",
                    "created_at" => date("Y-m-d H:i:s"),
                    "updated_at" => date("Y-m-d H:i:s")
                ],
                [
                    "id" => Str::uuid(),
                    "chave" => "private.empresa.contato.excluir",
                    "descricao" => "Permite excluir o contato de uma empresa",
                    "created_at" => date("Y-m-d H:i:s"),
                    "updated_at" => date("Y-m-d H:i:s")
                ],
                [
                    "id" => Str::uuid(),
                    "chave" => "private.empresa.contato.ativar",
                    "descricao" => "Permite ativar o contato de uma empresa",
                    "created_at" => date("Y-m-d H:i:s"),
                    "updated_at" => date("Y-m-d H:i:s")
                ],
                [
                    "id" => Str::uuid(),
                    "chave" => "private.empresa.contato.listar",
                    "descricao" => "Permite listar os contatos de uma empresa",
                    "created_at" => date("Y-m-d H:i:s"),
                    "updated_at" => date("Y-m-d H:i:s")
                ],
            //---

            // empresa endereço
                [
                    "id" => Str::uuid(),
                    "chave" => "private.empresa.endereco.cadastrar",
                    "descricao" => "Permite cadastrar um novo endereço para empresa",
                    "created_at" => date("Y-m-d H:i:s"),
                    "updated_at" => date("Y-m-d H:i:s")
                ],
                [
                    "id" => Str::uuid(),
                    "chave" => "private.empresa.endereco.atualizar",
                    "descricao" => "Permite atualizar o endereço de uma empresa",
                    "created_at" => date("Y-m-d H:i:s"),
                    "updated_at" => date("Y-m-d H:i:s")
                ],
                [
                    "id" => Str::uuid(),
                    "chave" => "private.empresa.endereco.visualizar",
                    "descricao" => "Permite visualizar o endereço de uma empresa",
                    "created_at" => date("Y-m-d H:i:s"),
                    "updated_at" => date("Y-m-d H:i:s")
                ],
                [
                    "id" => Str::uuid(),
                    "chave" => "private.empresa.endereco.excluir",
                    "descricao" => "Permite excluir o endereço de uma empresa",
                    "created_at" => date("Y-m-d H:i:s"),
                    "updated_at" => date("Y-m-d H:i:s")
                ],
                [
                    "id" => Str::uuid(),
                    "chave" => "private.empresa.endereco.ativar",
                    "descricao" => "Permite ativar o endereço de uma empresa",
                    "created_at" => date("Y-m-d H:i:s"),
                    "updated_at" => date("Y-m-d H:i:s")
                ],
                [
                    "id" => Str::uuid(),
                    "chave" => "private.empresa.endereco.listar",
                    "descricao" => "Permite listar os endereços de uma empresa",
                    "created_at" => date("Y-m-d H:i:s"),
                    "updated_at" => date("Y-m-d H:i:s")
                ],
            //---

            // grupo
                [
                    "id" => Str::uuid(),
                    "chave" => "private.grupo.menu",
                    "descricao" => "Permite visualizar o menu de grupos",
                    "created_at" => date("Y-m-d H:i:s"),
                    "updated_at" => date("Y-m-d H:i:s")
                ],
                [
                    "id" => Str::uuid(),
                    "chave" => "private.grupo.cadastrar",
                    "descricao" => "Permite cadastrar um novo grupo",
                    "created_at" => date("Y-m-d H:i:s"),
                    "updated_at" => date("Y-m-d H:i:s")
                ],
                [
                    "id" => Str::uuid(),
                    "chave" => "private.grupo.atualizar",
                    "descricao" => "Permite atualizar um grupo",
                    "created_at" => date("Y-m-d H:i:s"),
                    "updated_at" => date("Y-m-d H:i:s")
                ],
                [
                    "id" => Str::uuid(),
                    "chave" => "private.grupo.visualizar",
                    "descricao" => "Permite visualizar um grupo",
                    "created_at" => date("Y-m-d H:i:s"),
                    "updated_at" => date("Y-m-d H:i:s")
                ],
                [
                    "id" => Str::uuid(),
                    "chave" => "private.grupo.excluir",
                    "descricao" => "Permite excluir um grupo",
                    "created_at" => date("Y-m-d H:i:s"),
                    "updated_at" => date("Y-m-d H:i:s")
                ],
                [
                    "id" => Str::uuid(),
                    "chave" => "private.grupo.ativar",
                    "descricao" => "Permite ativar um grupo",
                    "created_at" => date("Y-m-d H:i:s"),
                    "updated_at" => date("Y-m-d H:i:s")
                ],
                [
                    "id" => Str::uuid(),
                    "chave" => "private.grupo.listar",
                    "descricao" => "Permite listar os grupos",
                    "created_at" => date("Y-m-d H:i:s"),
                    "updated_at" => date("Y-m-d H:i:s")
                ],
                [
                    "id" => Str::uuid(),
                    "chave" => "private.grupo.sincronizar_permissao",
                    "descricao" => "Permite vincular as permissões a um grupo",
                    "created_at" => date("Y-m-d H:i:s"),
                    "updated_at" => date("Y-m-d H:i:s")
                ],
            //---

            // usuário
                [
                    "id" => Str::uuid(),
                    "chave" => "private.usuario.menu",
                    "descricao" => "Permite visualizar o menu de usuários",
                    "created_at" => date("Y-m-d H:i:s"),
                    "updated_at" => date("Y-m-d H:i:s")
                ],
                [
                    "id" => Str::uuid(),
                    "chave" => "private.usuario.cadastrar",
                    "descricao" => "Permite cadastrar um novo usuário",
                    "created_at" => date("Y-m-d H:i:s"),
                    "updated_at" => date("Y-m-d H:i:s")
                ],
                [
                    "id" => Str::uuid(),
                    "chave" => "private.usuario.atualizar",
                    "descricao" => "Permite atualizar um usuário",
                    "created_at" => date("Y-m-d H:i:s"),
                    "updated_at" => date("Y-m-d H:i:s")
                ],
                [
                    "id" => Str::uuid(),
                    "chave" => "private.usuario.visualizar",
                    "descricao" => "Permite visualizar um usuário",
                    "created_at" => date("Y-m-d H:i:s"),
                    "updated_at" => date("Y-m-d H:i:s")
                ],
                [
                    "id" => Str::uuid(),
                    "chave" => "private.usuario.excluir",
                    "descricao" => "Permite excluir um usuário",
                    "created_at" => date("Y-m-d H:i:s"),
                    "updated_at" => date("Y-m-d H:i:s")
                ],
                [
                    "id" => Str::uuid(),
                    "chave" => "private.usuario.ativar",
                    "descricao" => "Permite ativar um usuário",
                    "created_at" => date("Y-m-d H:i:s"),
                    "updated_at" => date("Y-m-d H:i:s")
                ],
                [
                    "id" => Str::uuid(),
                    "chave" => "private.usuario.listar",
                    "descricao" => "Permite listar os usuários",
                    "created_at" => date("Y-m-d H:i:s"),
                    "updated_at" => date("Y-m-d H:i:s")
                ]
            //---
        ]);
    }
}
