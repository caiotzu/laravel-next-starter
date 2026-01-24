<?php

namespace Database\Seeders;

use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;


class PrivateEmpresaContatoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $empresa = DB::table("empresas")->where("cnpj", "12345678000190")->first();

        DB::table("empresa_contatos")->insert([
            [
                "id" => Str::uuid(),
                "empresa_id" => $empresa->id,
                "tipo" => "E",
                "valor" => "admin.nexus.mock@nexus.com.br",
                "ativo" => true,
                "principal" => true,
                "created_at" => date("Y-m-d H:i:s"),
                "updated_at" => date("Y-m-d H:i:s")
            ],
            [
                "id" => Str::uuid(),
                "empresa_id" => $empresa->id,
                "tipo" => "T",
                "valor" => "14111112222",
                "ativo" => true,
                "principal" => true,
                "created_at" => date("Y-m-d H:i:s"),
                "updated_at" => date("Y-m-d H:i:s")
            ],
        ]);
    }
}

