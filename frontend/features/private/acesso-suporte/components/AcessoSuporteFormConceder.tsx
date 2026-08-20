"use client";

import { useState } from "react";

import Link from "next/link";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ShieldAlert } from "lucide-react";
import { useForm, UseFormSetError } from "react-hook-form";

import { PrivatePermissionGuard } from "@/app/(private)/_components/guard/PrivatePermissionGuard";

import { AppAlert } from "@/components/feedback/AppAlert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { useAdministradores } from "@/domains/private/lookup/hooks/useAdministradores";
import { useDebouncedValue } from "@/hooks/use-debounce";

import {
  AcessoSuporteFormDataConceder,
  acessoSuporteSchemaConceder,
} from "../schemas/acessoSuporte.schema";

const OPCOES_DURACAO = [
  { valor: 15, label: "15 minutos" },
  { valor: 30, label: "30 minutos" },
  { valor: 60, label: "1 hora" },
  { valor: 120, label: "2 horas (máximo)" },
];

interface Props {
  onSubmit: (
    data: AcessoSuporteFormDataConceder,
    setError: UseFormSetError<AcessoSuporteFormDataConceder>
  ) => Promise<void>;
  isLoading?: boolean;
  backendErrors?: string[] | null;
  clearBackendErrors?: () => void;
}

export function AcessoSuporteFormConceder({
  onSubmit,
  isLoading = false,
  backendErrors = null,
  clearBackendErrors,
}: Props) {
  const [buscaAdmin, setBuscaAdmin] = useState("");
  const [confirmando, setConfirmando] = useState(false);

  const buscaDebounced = useDebouncedValue(buscaAdmin, 300);

  const {
    data: administradores,
    isLoading: carregandoAdmins,
  } = useAdministradores({
    busca: buscaDebounced || undefined,
  });

  const {
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    setError,
  } = useForm<AcessoSuporteFormDataConceder>({
    resolver: zodResolver(acessoSuporteSchemaConceder),
    defaultValues: { duracao_minutos: 30 },
  });

  const valores = watch();

  const adminSelecionado = administradores?.find(
    (a) => a.id === valores.usuario_admin_id
  );

  async function confirmarEnviar() {
    setConfirmando(false);
    await onSubmit(valores, setError);
  }

  return (
  <>
    <div className="w-full px-2 py-3 sm:px-3 lg:px-4">
      <Card className="w-full overflow-hidden rounded-2xl border bg-white shadow-sm">
        <div className="grid lg:grid-cols-[0.75fr_1.25fr]">
          {/* Lado informativo */}
          <div className="border-b bg-white p-6 sm:p-7 lg:border-b-0 lg:border-r lg:p-8 xl:p-10">
            <div className="flex h-full flex-col">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary  shadow-sm">
                  <ShieldAlert className="size-5 text-white" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-primary">
                    Suporte administrativo
                  </p>

                  <p className="text-xs font-medium text-muted-foreground">
                    Acesso temporário
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Conceder acesso de suporte
                </h2>

                <p className="mt-2 max-w-lg text-sm leading-5 text-muted-foreground">
                  Permita que um administrador acesse temporariamente os
                  dados da sua organização para auxiliar na resolução de
                  problemas.
                </p>
              </div>

              <div className="mt-6 space-y-5">
                <div className="flex gap-3">
                  <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-sm">
                    <span className="text-xs font-semibold">
                      1
                    </span>
                  </div>

                  <div>
                    <p className="text-sm font-medium">
                      Escolha o administrador
                    </p>

                    <p className="mt-1 text-sm leading-5 text-muted-foreground">
                      Selecione quem realizará o atendimento.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-sm">
                    <span className="text-xs font-semibold">
                      2
                    </span>
                  </div>

                  <div>
                    <p className="text-sm font-medium">
                      Defina a duração
                    </p>

                    <p className="mt-1 text-sm leading-5 text-muted-foreground">
                      O acesso será encerrado automaticamente ao final do
                      período.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-sm">
                    <span className="text-xs font-semibold">
                      3
                    </span>
                  </div>

                  <div>
                    <p className="text-sm font-medium">
                      Movimentações rastreadas
                    </p>

                    <p className="mt-1 text-sm leading-5 text-muted-foreground">
                      As ações realizadas durante o período de suporte são
                      registradas e acompanhadas.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 lg:mt-auto lg:pt-8">
                <div className="rounded-xl border bg-white p-3.5">
                  <div className="flex gap-3">
                    <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-600" />

                    <div>
                      <p className="text-sm font-medium">
                        Acesso controlado
                      </p>

                      <p className="mt-1 text-xs leading-5 text-muted-foreground">
                        O acesso é temporário e pode ser revogado a qualquer
                        momento.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Lado do formulário */}
          <div className="bg-white p-6 sm:p-7 lg:p-8 xl:p-10">
            <form
              onSubmit={handleSubmit(() => setConfirmando(true))}
              className="w-full"
            >
              {backendErrors && backendErrors.length > 0 && (
                <AppAlert
                  variant="error"
                  subtitle="Ocorreu um erro durante a operação"
                  messages={backendErrors}
                  onClose={clearBackendErrors}
                  className="mb-6"
                />
              )}

              <div className="w-full space-y-6">
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="usuario_admin_id">
                      Administrador{" "}
                      <span className="text-red-600">*</span>
                    </Label>

                    <Select
                      value={valores.usuario_admin_id}
                      onValueChange={(value) =>
                        setValue("usuario_admin_id", value, {
                          shouldValidate: true,
                        })
                      }
                    >
                      <SelectTrigger
                        id="usuario_admin_id"
                        className="h-11 w-full"
                      >
                        <SelectValue placeholder="Selecione um administrador" />
                      </SelectTrigger>

                      <SelectContent>
                        <div className="px-2 pb-2">
                          <input
                            value={buscaAdmin}
                            onChange={(e) => setBuscaAdmin(e.target.value)}
                            placeholder="Buscar por nome ou e-mail..."
                            className="w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                            onKeyDown={(e) => e.stopPropagation()}
                          />
                        </div>

                        {carregandoAdmins && (
                          <div className="px-2 py-2 text-sm text-muted-foreground">
                            Buscando...
                          </div>
                        )}

                        {administradores?.map((admin) => (
                          <SelectItem key={admin.id} value={admin.id}>
                            {admin.nome} — {admin.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {errors.usuario_admin_id && (
                      <p className="text-sm text-red-700">
                        {errors.usuario_admin_id.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duracao_minutos">
                      Duração <span className="text-red-600">*</span>
                    </Label>

                    <Select
                      value={String(valores.duracao_minutos ?? 30)}
                      onValueChange={(value) =>
                        setValue("duracao_minutos", Number(value), {
                          shouldValidate: true,
                        })
                      }
                    >
                      <SelectTrigger
                        id="duracao_minutos"
                        className="h-11 w-full"
                      >
                        <SelectValue placeholder="Selecione a duração" />
                      </SelectTrigger>

                      <SelectContent>
                        {OPCOES_DURACAO.map((opcao) => (
                          <SelectItem
                            key={opcao.valor}
                            value={String(opcao.valor)}
                          >
                            {opcao.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {errors.duracao_minutos && (
                      <p className="text-sm text-red-700">
                        {errors.duracao_minutos.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="motivo">Motivo</Label>

                  <Textarea
                    id="motivo"
                    rows={5}
                    placeholder="Descreva brevemente o motivo do suporte (opcional)"
                    className="min-h-[130px] w-full resize-y"
                    onChange={(e) =>
                      setValue("motivo", e.target.value)
                    }
                  />

                  {errors.motivo && (
                    <p className="text-sm text-red-700">
                      {errors.motivo.message}
                    </p>
                  )}
                </div>

                <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
                  <Button
                    asChild
                    variant="outline"
                    className="h-11 w-full sm:w-auto"
                  >
                    <Link href="/acesso-suporte">
                      Cancelar
                    </Link>
                  </Button>

                  <PrivatePermissionGuard permission="private.acesso_suporte.conceder">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="h-11 w-full cursor-pointer gap-2 sm:w-auto"
                    >
                      {isLoading && (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      )}

                      Conceder acesso
                    </Button>
                  </PrivatePermissionGuard>
                </div>
              </div>
            </form>
          </div>
        </div>
      </Card>
    </div>

    <AlertDialog open={confirmando} onOpenChange={setConfirmando}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <ShieldAlert className="size-5 text-amber-600" />
            Confirmar concessão de acesso
          </AlertDialogTitle>

          <AlertDialogDescription asChild>
            <div className="space-y-3 text-left">
              <p>
                Você está concedendo a{" "}
                <strong>
                  {adminSelecionado?.nome ?? "este administrador"}
                </strong>{" "}
                acesso temporário aos dados da sua organização por{" "}
                <strong>
                  {OPCOES_DURACAO.find(
                    (o) => o.valor === valores.duracao_minutos
                  )?.label ?? `${valores.duracao_minutos} minutos`}
                </strong>
                .
              </p>

              <p>
                O acesso será encerrado automaticamente ao final desse período e poderá
                ser revogado a qualquer momento. Durante o suporte, as ações realizadas
                serão registradas e acompanhadas.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>
            Cancelar
          </AlertDialogCancel>

          <AlertDialogAction onClick={confirmarEnviar}>
            Confirmar e conceder
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
);
}