"use client";

import { useState } from "react";
import { useGrupoEmpresas } from "../hooks/useGrupoEmpresas";
import { GrupoEmpresasSkeleton } from "./GrupoEmpresaSkeleton";

export default function GrupoEmpresasTable() {
  const [page, setPage] = useState(1);
  const [nome, setNome] = useState("");

  const { data, isLoading } = useGrupoEmpresas();

  if (isLoading) return <GrupoEmpresasSkeleton />;

  return (
    <div className="space-y-4">

      <input
        placeholder="Filtrar por nome..."
        className="border p-2 rounded-lg"
        value={nome}
        onChange={(e) => {
          setPage(1);
          setNome(e.target.value);
        }}
      />

      <table className="w-full border rounded-xl overflow-hidden">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-3 text-left">Nome</th>
            <th className="p-3 text-left">Data Cadastro</th>
          </tr>
        </thead>

        <tbody>
          {data?.data.map((grupo: any) => (
            <tr key={grupo.id} className="border-t">
              <td className="p-3">{grupo.nome}</td>
              <td className="p-3">
                {new Date(grupo.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex gap-3 items-center">
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Anterior
        </button>

        <span>
          Página {data?.current_page} de {data?.last_page}
        </span>

        <button
          disabled={page === data?.last_page}
          onClick={() => setPage((p) => p + 1)}
        >
          Próxima
        </button>
      </div>
    </div>
  );
}
