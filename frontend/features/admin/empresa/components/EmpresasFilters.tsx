"use client";

import { PerPage } from "@/components/data-tables/PerPage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import {
  ESTADOS_LABELS,
  ESTADOS_MAP,
  getLabelByUF,
  type UF,
} from "@/constants/estados";

interface Grupo {
  id: string;
  nome: string;
}

interface Props {
  grupoEmpresaNome: string;
  setGrupoEmpresaNome: (value: string) => void;
  grupoEmpresaId?: string;
  setGrupoEmpresaId: (value?: string) => void;
  grupos: Grupo[];
  isLoadingGrupos: boolean;

  nomeFantasia: string;
  setNomeFantasia: (value: string) => void;
  razaoSocial: string;
  setRazaoSocial: (value: string) => void;

  ativo: boolean;
  setAtivo: (value: boolean) => void;

  uf?: UF;
  setUf: (value?: UF) => void;

  excluido: boolean;
  setExcluido: (value: boolean) => void;

  porPagina: number;
  setPorPagina: (value: number) => void;
}

export function EmpresasFilters({
  grupoEmpresaNome,
  setGrupoEmpresaNome,
  grupoEmpresaId,
  setGrupoEmpresaId,
  grupos,
  isLoadingGrupos,
  nomeFantasia,
  setNomeFantasia,
  razaoSocial,
  setRazaoSocial,
  ativo,
  setAtivo,
  uf,
  setUf,
  excluido,
  setExcluido,
  porPagina,
  setPorPagina,
}: Props) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Filtros</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-wrap gap-4 items-end">
        {/* Grupo Empresa */}
        <div className="flex flex-col gap-2 w-64">
          <Label>Grupo Empresa</Label>

          <Combobox
            items={grupos}
            value={grupoEmpresaNome || null}
            onValueChange={(item) => {
              if (!item) {
                setGrupoEmpresaNome("");
                setGrupoEmpresaId(undefined);
                return;
              }

              setGrupoEmpresaNome(item.nome);
              setGrupoEmpresaId(item.id);
            }}
            itemToString={(item) => item?.nome ?? ""}
          >
            <ComboboxInput
              placeholder="Digite o nome do grupo..."
              showClear
            />

            <ComboboxContent>
              <ComboboxEmpty>
                {isLoadingGrupos
                  ? "Carregando..."
                  : "Nenhum grupo encontrado."}
              </ComboboxEmpty>

              <ComboboxList>
                {(item) => (
                  <ComboboxItem key={item.id} value={item}>
                    {item.nome}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Nome Fantasia</Label>
          <Input
            placeholder="Digite o nome fantasia..."
            value={nomeFantasia}
            onChange={(e) => setNomeFantasia(e.target.value)}
            className="w-64"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Razão Social</Label>
          <Input
            placeholder="Digite a razão social..."
            value={razaoSocial}
            onChange={(e) => setRazaoSocial(e.target.value)}
            className="w-64"
          />
        </div>

        <div className="flex flex-col gap-2 w-64">
          <Label>UF</Label>

          <Combobox
            items={ESTADOS_LABELS}
            value={uf ? getLabelByUF(uf) : null}
            onValueChange={(label) =>
              setUf(label ? ESTADOS_MAP.get(label) : undefined)
            }
          >
            <ComboboxInput placeholder="Selecione a UF" showClear />

            <ComboboxContent>
              <ComboboxEmpty>
                Nenhum estado encontrado.
              </ComboboxEmpty>

              <ComboboxList>
                {(item) => (
                  <ComboboxItem key={item} value={item}>
                    {item}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>

        <PerPage perPage={porPagina} onChange={setPorPagina} />

        <div className="flex items-center space-x-2">
          <Switch
            checked={ativo}
            onCheckedChange={setAtivo}
          />
          <Label>Ativas</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            checked={excluido}
            onCheckedChange={setExcluido}
          />
          <Label>Excluídas</Label>
        </div>
      </CardContent>
    </Card>
  );
}