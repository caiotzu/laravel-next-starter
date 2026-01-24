<?php

namespace Database\Seeders;

use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;


class PrivateEmpresaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $grupoEmpresa = DB::table("grupo_empresas")->where("nome", "Grupos Nexus")->first();

        DB::table("empresas")->insert([
            "id" => Str::uuid(),
            "grupo_empresa_id" => $grupoEmpresa->id,
            "matriz_id" => null,
            "cnpj" => "12345678000190",
            "nome_fantasia" => "Nexus Tech Solutions",
            "razao_social" => "Nexus Tecnologia e Soluções Digitais Ltda",
            "inscricao_estadual" => "987654321",
            "inscricao_municipal" => "12345678911",
            "ativo" => true,
            "uf" => "SP",
            "created_at" => date("Y-m-d H:i:s"),
            "updated_at" => date("Y-m-d H:i:s")
        ]);
    }
}



