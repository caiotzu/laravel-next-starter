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

interface EmpresaOption {
  id: string;
  nome_fantasia: string;
}

interface Props {
  id: string;
  setId: (value: string) => void;

  grupoEmpresaNome: string;
  setGrupoEmpresaNome: (value: string) => void;
  grupoEmpresaId?: string;
  setGrupoEmpresaId: (value?: string) => void;
  grupos: Grupo[];
  isLoadingGrupos: boolean;

  matrizNome: string;
  setMatrizNome: (value: string) => void;
  matrizId?: string;
  setMatrizId: (value?: string) => void;
  matrizes: EmpresaOption[];
  isLoadingMatrizes: boolean;

  cnpj: string;
  setCnpj: (value: string) => void;
  nomeFantasia: string;
  setNomeFantasia: (value: string) => void;
  razaoSocial: string;
  setRazaoSocial: (value: string) => void;
  inscricaoEstadual: string;
  setInscricaoEstadual: (value: string) => void;
  inscricaoMunicipal: string;
  setInscricaoMunicipal: (value: string) => void;

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
  id,
  setId,
  grupoEmpresaNome,
  setGrupoEmpresaNome,
  grupoEmpresaId,
  setGrupoEmpresaId,
  grupos,
  isLoadingGrupos,
  matrizNome,
  setMatrizNome,
  matrizId,
  setMatrizId,
  matrizes,
  isLoadingMatrizes,
  cnpj,
  setCnpj,
  nomeFantasia,
  setNomeFantasia,
  razaoSocial,
  setRazaoSocial,
  inscricaoEstadual,
  setInscricaoEstadual,
  inscricaoMunicipal,
  setInscricaoMunicipal,
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
        <div className="flex flex-col gap-2 w-64">
          <Label>ID</Label>
          <Input
            placeholder="UUID da empresa..."
            value={id}
            onChange={(e) => setId(e.target.value)}
          />
        </div>

        {/* Grupo Empresa */}
        <div className="flex flex-col gap-2 w-64">
          <Label>Grupo Empresa</Label>

          <Combobox
            items={grupos}
            value={grupos.find((item) => item.id === grupoEmpresaId) ?? null}
            onValueChange={(item) => {
              if (!item) {
                setGrupoEmpresaNome("");
                setGrupoEmpresaId(undefined);
                return;
              }

              setGrupoEmpresaNome(item.nome);
              setGrupoEmpresaId(item.id);
            }}
            itemToStringLabel={(item) => item?.nome ?? ""}
          >
            <ComboboxInput
              placeholder="Digite o nome do grupo..."
              value={grupoEmpresaNome}
              showClear
              onChange={(e) => {
                setGrupoEmpresaNome(e.target.value);
                setGrupoEmpresaId(undefined);
              }}
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

        <div className="flex flex-col gap-2 w-64">
          <Label>Matriz</Label>

          <Combobox
            items={matrizes}
            value={matrizes.find((item) => item.id === matrizId) ?? null}
            onValueChange={(item) => {
              if (!item) {
                setMatrizNome("");
                setMatrizId(undefined);
                return;
              }

              setMatrizNome(item.nome_fantasia);
              setMatrizId(item.id);
            }}
            itemToStringLabel={(item) => item?.nome_fantasia ?? ""}
          >
            <ComboboxInput
              placeholder="Digite o nome da matriz..."
              value={matrizNome}
              showClear
              onChange={(e) => {
                setMatrizNome(e.target.value);
                setMatrizId(undefined);
              }}
            />

            <ComboboxContent>
              <ComboboxEmpty>
                {isLoadingMatrizes
                  ? "Carregando..."
                  : "Nenhuma matriz encontrada."}
              </ComboboxEmpty>

              <ComboboxList>
                {(item) => (
                  <ComboboxItem key={item.id} value={item}>
                    {item.nome_fantasia}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>

        <div className="flex flex-col gap-2 w-64">
          <Label>CNPJ</Label>
          <Input
            placeholder="Digite o CNPJ (14 dígitos)..."
            value={cnpj}
            onChange={(e) => setCnpj(e.target.value.replace(/\D/g, "").slice(0, 14))}
          />
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

        <div className="flex flex-col gap-2">
          <Label>Inscrição Estadual</Label>
          <Input
            placeholder="Digite a inscrição estadual..."
            value={inscricaoEstadual}
            onChange={(e) => setInscricaoEstadual(e.target.value)}
            className="w-64"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Inscrição Municipal</Label>
          <Input
            placeholder="Digite a inscrição municipal..."
            value={inscricaoMunicipal}
            onChange={(e) => setInscricaoMunicipal(e.target.value)}
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
