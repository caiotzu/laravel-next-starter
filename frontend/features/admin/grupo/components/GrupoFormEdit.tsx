"use client";

import { useMemo, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Users,
  Shield,
  Loader2,
  ChevronDown,
} from "lucide-react";
import {
  useForm,
  UseFormSetError,
} from "react-hook-form";

import { AdminPermissionGuard } from "@/app/admin/_components/guard/AdminPermissionGuard";

import { AppAlert } from "@/components/feedback/AppAlert";
import { Button } from "@/components/ui/button";
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

import {
  GrupoFormDataEdicao,
  grupoSchemaEdicao,
} from "../schemas/grupo.schema";

interface Props {
  grupo: Grupo;
  permissoes: Permissao[];

  onSubmitGrupo: (
    data: GrupoFormDataEdicao,
    setError: UseFormSetError<GrupoFormDataEdicao>
  ) => Promise<void>;

  onSubmitPermissoes: (
    permissoes: string[]
  ) => Promise<void>;

  isLoadingGrupo?: boolean;
  isLoadingPermissoes?: boolean;

  backendErrors?: string[] | null;
  clearBackendErrors?: () => void;
}

export function GrupoFormEdit({
  grupo,
  permissoes,
  onSubmitGrupo,
  onSubmitPermissoes,
  isLoadingGrupo = false,
  isLoadingPermissoes = false,
  backendErrors = null,
  clearBackendErrors,
}: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<GrupoFormDataEdicao>({
    resolver: zodResolver(grupoSchemaEdicao),
    defaultValues: {
      descricao: grupo.descricao,
    },
  });

  const [activeTab, setActiveTab] = useState("grupo");

  const [selectedPermissions, setSelectedPermissions] = useState<string[]>( grupo.permissoes?.map((p) => p.id) ?? []);

  const [openedGroups, setOpenedGroups] = useState<Record<string, boolean>>({});

  const groupedPermissions = useMemo(() => {
    return permissoes.reduce<Record<string, Permissao[]>>((acc, permissao) => {
      const parts = permissao.chave.split(".");

      const group =
        parts.length >= 3
          ? parts.slice(1, parts.length - 1).join(".")
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

  function formatPermissionLabel( chave: string ) {
    const action = chave.split(".").pop() ?? chave;

    const labels: Record<string, string> = {
      menu: "Visualizar Menu",
      listar: "Listar",
      visualizar: "Visualizar",
      cadastrar: "Cadastrar",
      atualizar: "Editar",
      excluir: "Excluir",
      ativar: "Ativar",
      sincronizar_permissao: "Gerenciar Permissões"
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

  function togglePermission(
    permissaoId: string,
    checked: boolean
  ) {
    setSelectedPermissions((prev) => {
      if (checked) {
        return [...new Set([...prev, permissaoId])];
      }

      return prev.filter(
        (id) => id !== permissaoId
      );
    });
  }

  function toggleGroup(
    group: string,
    checked: boolean
  ) {
    const ids = groupedPermissions[group].map((p) => p.id);

    setSelectedPermissions((prev) => {
      if (checked) {
        return [...new Set([...prev, ...ids])];
      }

      return prev.filter(
        (id) => !ids.includes(id)
      );
    });
  }

  async function handleGrupoSubmit(data: GrupoFormDataEdicao) {
    await onSubmitGrupo(data, setError);
  }

  async function handleSalvarPermissoes() {
    await onSubmitPermissoes(selectedPermissions);
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          Editar Grupo
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {backendErrors &&
          backendErrors.length > 0 && (
            <AppAlert
              variant="error"
              subtitle="Ocorreu um erro durante a operação"
              messages={backendErrors}
              onClose={clearBackendErrors}
            />
          )}

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="grupo" className="w-full">
              <Users className="h-4 w-4 mr-2" />
              Grupo
            </TabsTrigger>

            <TabsTrigger value="permissoes" className="w-full">
              <Shield className="h-4 w-4 mr-2" />
              Permissões
            </TabsTrigger>
          </TabsList>

          <TabsContent value="grupo" className="pt-6" >
            <form onSubmit={handleSubmit(handleGrupoSubmit)}>
              <div className="space-y-4">
                <div className="rounded-xl border p-6">
                  <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-12 md:col-span-4 space-y-2">
                      <Label> 
                        Descrição  <span className="text-red-600">*</span>
                      </Label>

                      <Input {...register("descricao")} />

                      {errors.descricao && (
                        <p className="text-sm text-red-600 mt-1">
                          { errors.descricao.message }
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <AdminPermissionGuard permission="admin.grupo.atualizar">
                    <Button
                      type="submit"
                      disabled={ isLoadingGrupo }
                      className="cursor-pointer"
                    >
                      {isLoadingGrupo && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Salvar Grupo
                    </Button>
                  </AdminPermissionGuard>
                </div>
              </div>
            </form>
          </TabsContent>

          <TabsContent
            value="permissoes"
            className="pt-6"
          >
            <div className="space-y-4">
              {Object.entries(groupedPermissions).map(([group,permissions,]) => {
                const allSelected =  permissions.every((p) => selectedPermissions.includes(p.id));
                const selectedCount = permissions.filter( (p) => selectedPermissions.includes(p.id)).length;
                const isOpen = openedGroups[group] ?? true;

                return (
                  <Card
                    key={group}
                    className="overflow-hidden cursor-pointer py-0"
                  >
                    <div
                      className="flex items-center justify-between p-4"
                      onClick={() => setOpenedGroups((prev) => ({...prev,[group]: !isOpen,})) }
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {formatGroupLabel(group)}
                        </span>

                        <span className="text-xs text-muted-foreground">
                          {selectedCount} / { permissions.length } {" "}
                          selecionadas
                        </span>
                      </div>

                      <div
                        className="flex items-center gap-4"
                        onClick={(e) => e.stopPropagation() }
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={ allSelected }
                            onCheckedChange={( checked ) => toggleGroup(group, Boolean(checked))}
                          />

                          <span className="text-sm">
                            Todas
                          </span>
                        </div>

                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${ isOpen ? "rotate-180": "" }`}
                        />
                      </div>
                    </div>

                    {isOpen && (
                      <div className="border-t p-4">
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                          {permissions.map((permissao) => (
                            <div
                              key={ permissao.id}
                              className="flex items-start gap-3 rounded-lg border p-3"
                            >
                              <Checkbox
                                checked={selectedPermissions.includes(permissao.id)}
                                onCheckedChange={(checked) => togglePermission( permissao.id, Boolean(checked))}
                              />
                              <div>
                                <p className="font-medium text-sm">
                                  {formatPermissionLabel(permissao.chave)}
                                </p>

                                <p className="text-xs text-muted-foreground">
                                  { permissao.descricao}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
              <div className="flex justify-end">
                <AdminPermissionGuard permission="admin.grupo.sincronizar_permissao">
                  <Button
                    onClick={ handleSalvarPermissoes}
                    disabled={ isLoadingPermissoes}
                    className="cursor-pointer"
                  >
                    {isLoadingPermissoes && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Salvar Permissões
                  </Button>
                </AdminPermissionGuard>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}