"use client";

import { PerPage } from "@/components/data-tables/PerPage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface Props {
  nome: string;
  setNome: (value: string) => void;
  excluido: boolean;
  setExcluido: (value: boolean) => void;
  porPagina: number;
  setPorPagina: (value: number) => void;
}

export function GrupoEmpresasFilters({
  nome,
  setNome,
  excluido,
  setExcluido,
  porPagina,
  setPorPagina
}: Props) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Filtros</CardTitle>
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

        <div className="flex items-center space-x-2">
          <Switch
            id="grupos-empresas-excluidos"
            checked={excluido}
            onCheckedChange={(checked) => setExcluido(checked)}
          />
          <Label htmlFor="grupos-empresas-excluidos">
            Excluídos
          </Label>
        </div>
      </CardContent>
    </Card>
  );
}
