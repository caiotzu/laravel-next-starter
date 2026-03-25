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
  EMPRESA_CONTATO_TIPO_OPTIONS,
  getEmpresaContatoTipoLabel,
} from "@/constants/empresa-contato-tipos";
import { maskPhone } from "@/lib/utils";

import { EmpresaContatoFormData } from "../schemas/empresa.schema";

interface Props {
  draft: EmpresaContatoFormData;
  items: EmpresaContatoFormData[];
  draftErrors: Partial<Record<keyof EmpresaContatoFormData, string>>;
  generalError?: string;
  editingIndex: number | null;
  isLoading?: boolean;
  onDraftChange: (
    key: keyof EmpresaContatoFormData,
    value: string | boolean
  ) => void;
  onSave: () => void;
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
}

export function EmpresaContatosTab({
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
  const valorPlaceholder =
    draft.tipo === "E" ? "Digite o e-mail" : "Digite o telefone";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {editingIndex === null ? "Adicionar Contato" : "Editar Contato"}
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
                  {EMPRESA_CONTATO_TIPO_OPTIONS.map((tipo) => (
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

            <div className="col-span-12 md:col-span-6 space-y-2">
              <Label htmlFor="contato-valor">Valor</Label>
              <Input
                id="contato-valor"
                value={draft.valor}
                onChange={(e) =>
                  onDraftChange(
                    "valor",
                    draft.tipo === "T"
                      ? maskPhone(e.target.value)
                      : e.target.value
                  )
                }
                placeholder={valorPlaceholder}
                disabled={isLoading}
              />
              {draftErrors.valor && (
                <p className="text-sm text-red-700">{draftErrors.valor}</p>
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
                <span className="text-sm">Contato principal</span>
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
                <span className="text-sm">Contato ativo</span>
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
              {editingIndex === null ? "Adicionar Contato" : "Salvar Contato"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contatos Adicionados</CardTitle>
        </CardHeader>

        <CardContent>
          {!items.length ? (
            <p className="text-sm text-muted-foreground">
              Nenhum contato adicionado.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Principal</TableHead>
                  <TableHead>Ativo</TableHead>
                  <TableHead className="text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={`${item.tipo}-${item.valor}-${index}`}>
                    <TableCell>{getEmpresaContatoTipoLabel(item.tipo)}</TableCell>
                    <TableCell>
                      {item.tipo === "T" ? maskPhone(item.valor) : item.valor}
                    </TableCell>
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
