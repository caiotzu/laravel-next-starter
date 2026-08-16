<?php

namespace Database\Seeders;

use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Seeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

use App\Enums\EmpresaContatoTipo;


class PrivateEmpresaContatoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $empresa = DB::table("empresas")->where("cnpj", "12345678000190")->first();

        $contatos = [
            [
                "tipo" => EmpresaContatoTipo::EMAIL->value,
                "valor" => "admin.nexus.mock@nexus.com.br",
            ],
            [
                "tipo" => EmpresaContatoTipo::TELEFONE->value,
                "valor" => "14111112222",
            ],
        ];

        foreach ($contatos as $contato) {
            $existe = DB::table("empresa_contatos")
                ->where("empresa_id", $empresa->id)
                ->where("tipo", $contato["tipo"])
                ->where("valor", $contato["valor"])
                ->exists();

            if ($existe) {
                continue;
            }

            DB::table("empresa_contatos")->insert([
                "id" => Str::uuid(),
                "empresa_id" => $empresa->id,
                "tipo" => $contato["tipo"],
                "valor" => $contato["valor"],
                "ativo" => true,
                "principal" => true,
                "created_at" => date("Y-m-d H:i:s"),
                "updated_at" => date("Y-m-d H:i:s")
            ]);
        }
    }
}

