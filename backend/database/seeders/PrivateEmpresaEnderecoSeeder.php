<?php

namespace Database\Seeders;

use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;


class PrivateEmpresaEnderecoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $empresa = DB::table("empresas")->where("cnpj", "12345678000190")->first();
        $municipio = DB::table("municipios")->where("codigo_siafi", "6681")->first();


        DB::table("empresa_enderecos")->insert([
            "id" => Str::uuid(),
            "empresa_id" => $empresa->id,
            "tipo" => "Comercial",
            "municipio_id" => $municipio->id,
            "ativo" => true,
            "principal" => true,
            "cep" => "17511395",
            "logradouro" => "Rua Francisco Martineli",
            "numero" => "123",
            "bairro" => "Palmital",
            "complemento" => "Casa",
            "created_at" => date("Y-m-d H:i:s"),
            "updated_at" => date("Y-m-d H:i:s")
        ]);
    }
}
