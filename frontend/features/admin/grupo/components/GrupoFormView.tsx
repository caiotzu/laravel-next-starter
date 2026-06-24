"use client";

import { useMemo, useState } from "react";

import {
  Users,
  Shield,
  ChevronDown,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import { Grupo } from "@/domains/admin/grupo/types/grupo.model";
import { Permissao } from "@/domains/admin/permissao/types/permissao.model";

interface Props {
  grupo: Grupo;
  permissoes: Permissao[];
}

export function GrupoFormView({
  grupo,
  permissoes,
}: Props) {
  const [activeTab, setActiveTab] = useState("grupo");

  const [openedGroups, setOpenedGroups] = useState<Record<string, boolean>>({});

  const selectedPermissions = grupo.permissoes?.map((p) => p.id) ?? [];

  const groupedPermissions = useMemo(() => {
    return permissoes.reduce<Record<string, Permissao[]>>((acc, permissao) => {
      const parts = permissao.chave.split(".");

      const group =
        parts.length >= 3
          ? parts
              .slice(1, parts.length - 1)
              .join(".")
          : parts[1] ?? "geral";

      if (!acc[group]) {
        acc[group] = [];
      }

      acc[group].push(permissao);

      return acc;
    }, {});
  }, [permissoes]);

  function formatGroupLabel(group: string) {
    return group
      .split(".")
      .map((item) =>
        item
          .split("_")
          .map(
            (word) =>
              word.charAt(0).toUpperCase() +
              word.slice(1)
          )
          .join(" ")
      )
      .join(" › ");
  }

  function formatPermissionLabel(chave: string) {
    const action =
      chave.split(".").pop() ?? chave;

    const labels: Record<string, string> = {
      menu: "Visualizar Menu",
      listar: "Listar",
      visualizar: "Visualizar",
      cadastrar: "Cadastrar",
      atualizar: "Editar",
      excluir: "Excluir",
      ativar: "Ativar",
      sincronizar_permissao: "Gerenciar Permissões",
    };

    return (
      labels[action] ??
      action
        .replaceAll("_", " ")
        .replace(/\b\w/g, (l) =>
          l.toUpperCase()
        )
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          Visualizar Grupo
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="grupo" className="w-full">
              <Users className="h-4 w-4 mr-2" />
              Grupo
            </TabsTrigger>

            <TabsTrigger value="permissoes" className="w-full" >
              <Shield className="h-4 w-4 mr-2" />
              Permissões
            </TabsTrigger>
          </TabsList>

          <TabsContent value="grupo" className="pt-6" >
            <div className="rounded-xl border p-6">
              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 md:col-span-4 space-y-2">
                  <Label>
                    Descrição
                  </Label>

                  <Input
                    value={grupo.descricao}
                    disabled
                    readOnly
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="permissoes" className="pt-6">
            <div className="space-y-4">
              {Object.entries(groupedPermissions).map(([group, permissions]) => {
                const selectedCount = permissions.filter((p) => selectedPermissions.includes(p.id)).length;
                const allSelected = selectedCount === permissions.length;
                const isOpen = openedGroups[group] ?? true;

                return (
                  <Card
                    key={group}
                    className="overflow-hidden"
                  >
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer"
                      onClick={() => setOpenedGroups((prev) => ({...prev,[group]: !isOpen,}))}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {formatGroupLabel(group)}
                        </span>

                        <span className="text-xs text-muted-foreground">
                          {selectedCount}{" "}/{" "}
                          {permissions.length}{" "}
                          selecionadas
                        </span>
                      </div>

                      <div
                        className="flex items-center gap-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox checked={allSelected} disabled />
                          <span className="text-sm">
                            Todas
                          </span>
                        </div>

                        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}/>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="border-t p-4">
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                          {permissions.map((permissao) => (
                              <div key={permissao.id} className="flex items-start gap-3 rounded-lg border p-3">
                                <Checkbox
                                  checked={selectedPermissions.includes(permissao.id)}
                                  disabled
                                />

                                <div>
                                  <p className="font-medium text-sm">
                                    {formatPermissionLabel(permissao.chave)}
                                  </p>

                                  <p className="text-xs text-muted-foreground">
                                    {permissao.descricao}
                                  </p>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}