"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { PerPage } from "@/components/data-tables/PerPage";

interface Props {
  nome: string;
  setNome: (value: string) => void;
  porPagina: number;
  setPorPagina: (value: number) => void;
}

export function GrupoEmpresasFilters({
  nome,
  setNome,
  porPagina,
  setPorPagina
}: Props) {
  const router = useRouter();

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Filtros</CardTitle>

        <Button onClick={() => router.push("/admin/grupos-empresas/cadastrar")}>
          <Plus className="mr-2 h-4 w-4" />
          Cadastrar
        </Button>
      </CardHeader>

      <CardContent className="flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Nome</label>
          <Input
            placeholder="Digite o nome..."
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="w-64"
          />
        </div>

        <PerPage 
          perPage={porPagina}
          onChange={setPorPagina}
        />
      </CardContent>
    </Card>
  );
}
