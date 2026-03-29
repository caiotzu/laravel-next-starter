"use client";

import { Loader2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  EMPRESA_ENDERECO_TIPO_OPTIONS,
  getEmpresaEnderecoTipoLabel,
} from "@/constants/empresa-endereco-tipos";
import { MunicipioLookupItem } from "@/domains/admin/lookup/types/lookup.responses";
import { maskCEP } from "@/lib/utils";

import { EmpresaEnderecoFormData } from "../schemas/empresa.schema";

interface Props {
  draft: EmpresaEnderecoFormData;
  items: EmpresaEnderecoFormData[];
  draftErrors: Partial<Record<keyof EmpresaEnderecoFormData, string>>;
  generalError?: string;
  editingIndex: number | null;
  isLoading?: boolean;
  municipioInputValue?: string;
  selectedMunicipio?: MunicipioLookupItem | null;
  municipioItems?: MunicipioLookupItem[];
  municipiosByIndex?: Array<MunicipioLookupItem | null>;
  isLoadingMunicipios?: boolean;
  isLoadingCep?: boolean;
  cepLookupMessage?: string;
  onDraftChange: (
    key: keyof EmpresaEnderecoFormData,
    value: string | boolean
  ) => void;
  onMunicipioInputChange?: (value: string) => void;
  onMunicipioSelect?: (item: MunicipioLookupItem | null) => void;
  onSave: () => void;
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
}

export function EmpresaEnderecosTab({
  draft,
  items,
  draftErrors,
  generalError,
  editingIndex,
  isLoading = false,
  municipioInputValue = "",
  selectedMunicipio = null,
  municipioItems = [],
  municipiosByIndex = [],
  isLoadingMunicipios = false,
  isLoadingCep = false,
  cepLookupMessage,
  onDraftChange,
  onMunicipioInputChange,
  onMunicipioSelect,
  onSave,
  onEdit,
  onRemove,
}: Props) {
  const municipioSelecionadoNaLista =
    selectedMunicipio
      ? [
          selectedMunicipio,
          ...municipioItems.filter((item) => item.id !== selectedMunicipio.id),
        ]
      : municipioItems;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {editingIndex === null ? "Adicionar Endereço" : "Editar Endereço"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {generalError && (
            <p className="text-sm text-red-700">{generalError}</p>
          )}

          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 md:col-span-3 space-y-2">
              <Label htmlFor="endereco-cep">CEP</Label>
              <Input
                id="endereco-cep"
                value={draft.cep}
                onChange={(e) => onDraftChange("cep", maskCEP(e.target.value))}
                placeholder="00000-000"
                disabled={isLoading}
              />
              {isLoadingCep && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Consultando CEP...
                </p>
              )}
              {!isLoadingCep && cepLookupMessage && (
                <p className="text-sm text-muted-foreground">{cepLookupMessage}</p>
              )}
              {draftErrors.cep && (
                <p className="text-sm text-red-700">{draftErrors.cep}</p>
              )}
            </div>

            <div className="col-span-12 md:col-span-6 space-y-2">
              <Label htmlFor="endereco-logradouro">Logradouro</Label>
              <Input
                id="endereco-logradouro"
                value={draft.logradouro}
                onChange={(e) => onDraftChange("logradouro", e.target.value)}
                placeholder="Digite o logradouro"
                disabled={isLoading}
              />
              {draftErrors.logradouro && (
                <p className="text-sm text-red-700">{draftErrors.logradouro}</p>
              )}
            </div>

            <div className="col-span-12 md:col-span-3 space-y-2">
              <Label htmlFor="endereco-numero">Número</Label>
              <Input
                id="endereco-numero"
                value={draft.numero}
                onChange={(e) => onDraftChange("numero", e.target.value)}
                placeholder="Numero"
                disabled={isLoading}
              />
              {draftErrors.numero && (
                <p className="text-sm text-red-700">{draftErrors.numero}</p>
              )}
            </div>

            <div className="col-span-12 md:col-span-4 space-y-2">
              <Label htmlFor="endereco-complemento">Complemento</Label>
              <Input
                id="endereco-complemento"
                value={draft.complemento ?? ""}
                onChange={(e) => onDraftChange("complemento", e.target.value)}
                placeholder="Complemento"
                disabled={isLoading}
              />
              {draftErrors.complemento && (
                <p className="text-sm text-red-700">{draftErrors.complemento}</p>
              )}
            </div>

            <div className="col-span-12 md:col-span-4 space-y-2">
              <Label htmlFor="endereco-bairro">Bairro</Label>
              <Input
                id="endereco-bairro"
                value={draft.bairro}
                onChange={(e) => onDraftChange("bairro", e.target.value)}
                placeholder="Digite o bairro"
                disabled={isLoading}
              />
              {draftErrors.bairro && (
                <p className="text-sm text-red-700">{draftErrors.bairro}</p>
              )}
            </div>

            <div className="col-span-12 md:col-span-4 space-y-2">
              <Label>Município</Label>
              {onMunicipioSelect ? (
                <Combobox
                  items={municipioSelecionadoNaLista}
                  value={selectedMunicipio}
                  onValueChange={onMunicipioSelect}
                  itemToStringLabel={(item) =>
                    item ? `${item.nome} - ${item.uf}` : ""
                  }
                >
                  <ComboboxInput
                    placeholder="Digite o municipio..."
                    value={municipioInputValue}
                    showClear
                    disabled={isLoading}
                    onChange={(e) => onMunicipioInputChange?.(e.target.value)}
                  />

                  <ComboboxContent>
                    <ComboboxEmpty>
                      {isLoadingMunicipios
                        ? "Carregando..."
                        : "Nenhum municipio encontrado."}
                    </ComboboxEmpty>

                    <ComboboxList>
                      {(item) => (
                        <ComboboxItem key={item.id} value={item}>
                          {item.nome} - {item.uf}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              ) : (
                <Input
                  id="endereco-municipio-id"
                  value={draft.municipio_id}
                  onChange={(e) => onDraftChange("municipio_id", e.target.value)}
                  placeholder="UUID do municipio"
                  disabled={isLoading}
                />
              )}
              {draftErrors.municipio_id && (
                <p className="text-sm text-red-700">
                  {draftErrors.municipio_id}
                </p>
              )}
            </div>

            <div className="col-span-12 md:col-span-4 space-y-2">
              <Label>Tipo</Label>
              <Select
                value={draft.tipo}
                onValueChange={(value) => onDraftChange("tipo", value)}
                disabled={isLoading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>

                <SelectContent>
                  {EMPRESA_ENDERECO_TIPO_OPTIONS.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {draftErrors.tipo && (
                <p className="text-sm text-red-700">{draftErrors.tipo}</p>
              )}
            </div>

            <div className="col-span-12 md:col-span-1 space-y-2 mt-6">
              <div className="flex min-h-12 items-center gap-2 rounded-md px-3">
                <Switch
                  checked={draft.principal}
                  onCheckedChange={(value) => onDraftChange("principal", value)}
                  disabled={isLoading}
                />
                <span className="text-sm">Principal</span>
              </div>
              {draftErrors.principal && (
                <p className="text-sm text-red-700">{draftErrors.principal}</p>
              )}
            </div>

            <div className="col-span-12 md:col-span-2 space-y-2 mt-6">
              <div className="flex min-h-12 items-center gap-2 rounded-md px-3">
                <Switch
                  checked={draft.ativo}
                  onCheckedChange={(value) => onDraftChange("ativo", value)}
                  disabled={isLoading}
                />
                <span className="text-sm">Ativo</span>
              </div>
              {draftErrors.ativo && (
                <p className="text-sm text-red-700">{draftErrors.ativo}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              onClick={onSave}
              disabled={isLoading}
              className="cursor-pointer"
            >
              {editingIndex === null ? "Adicionar Endereco" : "Salvar Endereco"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Endereços Adicionados</CardTitle>
        </CardHeader>

        <CardContent>
          {!items.length ? (
            <p className="text-sm text-muted-foreground">
              Nenhum endereço adicionado.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Município</TableHead>
                  <TableHead>CEP</TableHead>
                  <TableHead>Logradouro</TableHead>
                  <TableHead>Número</TableHead>
                  <TableHead>Complemento</TableHead>
                  <TableHead>Bairro</TableHead>
                  <TableHead>Principal</TableHead>
                  <TableHead>Ativo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={`${item.tipo}-${item.municipio_id}-${index}`}>
                    <TableCell>{getEmpresaEnderecoTipoLabel(item.tipo)}</TableCell>
                    <TableCell>
                      {municipiosByIndex[index]
                        ? `${municipiosByIndex[index]?.nome} - ${municipiosByIndex[index]?.uf}`
                        : item.municipio_id}
                    </TableCell>
                    <TableCell>{maskCEP(item.cep)}</TableCell>
                    <TableCell>{item.logradouro}</TableCell>
                    <TableCell>{item.numero}</TableCell>
                    <TableCell>{item.complemento || "---"}</TableCell>
                    <TableCell>{item.bairro}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          item.principal
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }
                      >
                        {item.principal ? "Sim" : "Nao"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          item.ativo
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }
                      >
                        {item.ativo ? "Sim" : "Nao"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={isLoading}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => onEdit(index)}
                            className="flex items-center cursor-pointer"
                          >
                            <Pencil className="h-4 w-4" />
                            Alterar
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => onRemove(index)}
                            variant="destructive"
                            className="flex items-center cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
