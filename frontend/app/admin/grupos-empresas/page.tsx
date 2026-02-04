import GrupoEmpresasTable from "@/features/grupo-empresa/components/GrupoEmpresasTable";

export default function Page() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">
        Grupos de Empresas
      </h1>

      <GrupoEmpresasTable />
    </div>
  );
}
