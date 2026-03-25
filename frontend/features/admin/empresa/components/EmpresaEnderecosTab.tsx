"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { maskCEP } from "@/lib/utils";

import { EmpresaEnderecoFormData } from "../schemas/empresa.schema";

interface Props {
  draft: EmpresaEnderecoFormData;
  items: EmpresaEnderecoFormData[];
  draftErrors: Partial<Record<keyof EmpresaEnderecoFormData, string>>;
  generalError?: string;
  editingIndex: number | null;
  isLoading?: boolean;
  onDraftChange: (
    key: keyof EmpresaEnderecoFormData,
    value: string | boolean
  ) => void;
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
  onDraftChange,
  onSave,
  onEdit,
  onRemove,
}: Props) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {editingIndex === null ? "Adicionar Endereco" : "Editar Endereco"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {generalError && (
            <p className="text-sm text-red-700">{generalError}</p>
          )}

          <div className="grid grid-cols-12 gap-6">
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

            <div className="col-span-12 md:col-span-4 space-y-2">
              <Label htmlFor="endereco-municipio-id">Municipio</Label>
              <Input
                id="endereco-municipio-id"
                value={draft.municipio_id}
                onChange={(e) => onDraftChange("municipio_id", e.target.value)}
                placeholder="UUID do municipio"
                disabled={isLoading}
              />
              {draftErrors.municipio_id && (
                <p className="text-sm text-red-700">
                  {draftErrors.municipio_id}
                </p>
              )}
            </div>

            <div className="col-span-12 md:col-span-2 space-y-2">
              <Label htmlFor="endereco-cep">CEP</Label>
              <Input
                id="endereco-cep"
                value={draft.cep}
                onChange={(e) => onDraftChange("cep", maskCEP(e.target.value))}
                placeholder="00000-000"
                disabled={isLoading}
              />
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

            <div className="col-span-12 md:col-span-2 space-y-2">
              <Label htmlFor="endereco-numero">Numero</Label>
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

            <div className="col-span-12 md:col-span-3 space-y-2">
              <Label>Principal</Label>
              <div className="flex items-center gap-2">
                <Switch
                  checked={draft.principal}
                  onCheckedChange={(value) => onDraftChange("principal", value)}
                  disabled={isLoading}
                />
                <span className="text-sm">Endereco principal</span>
              </div>
              {draftErrors.principal && (
                <p className="text-sm text-red-700">{draftErrors.principal}</p>
              )}
            </div>

            <div className="col-span-12 md:col-span-3 space-y-2">
              <Label>Ativo</Label>
              <div className="flex items-center gap-2">
                <Switch
                  checked={draft.ativo}
                  onCheckedChange={(value) => onDraftChange("ativo", value)}
                  disabled={isLoading}
                />
                <span className="text-sm">Endereco ativo</span>
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
              <Plus className="h-4 w-4" />
              {editingIndex === null ? "Adicionar Endereco" : "Salvar Endereco"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Enderecos Adicionados</CardTitle>
        </CardHeader>

        <CardContent>
          {!items.length ? (
            <p className="text-sm text-muted-foreground">
              Nenhum endereco adicionado.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>CEP</TableHead>
                  <TableHead>Logradouro</TableHead>
                  <TableHead>Bairro</TableHead>
                  <TableHead>Principal</TableHead>
                  <TableHead>Ativo</TableHead>
                  <TableHead className="text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={`${item.tipo}-${item.municipio_id}-${index}`}>
                    <TableCell>{getEmpresaEnderecoTipoLabel(item.tipo)}</TableCell>
                    <TableCell>{maskCEP(item.cep)}</TableCell>
                    <TableCell>{item.logradouro}</TableCell>
                    <TableCell>{item.bairro}</TableCell>
                    <TableCell>{item.principal ? "Sim" : "Nao"}</TableCell>
                    <TableCell>{item.ativo ? "Sim" : "Nao"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(index)}
                          disabled={isLoading}
                        >
                          <Pencil className="h-4 w-4" />
                          Alterar
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onRemove(index)}
                          disabled={isLoading}
                        >
                          <Trash2 className="h-4 w-4" />
                          Excluir
                        </Button>
                      </div>
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
