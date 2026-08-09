"use client";

import { useState } from "react";

import {
  Check,
  Code2,
  Copy,
  Eye,
} from "lucide-react";

import { Info } from "@/components/common/Info";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  getAuditoriaAcaoBadge,
  getAuditoriaAcaoLabel,
} from "@/constants/auditoria-acao";
import { getAuditoriaEntidadeLabel } from "@/constants/auditoria-entidade";
import { Auditoria } from "@/domains/admin/auditoria/types/auditoria.model";
import { formatDate } from "@/lib/utils";

interface Props {
  data: Auditoria[];
}

function formatValor(valor: unknown): string {
  if (valor === null || valor === undefined) return "---";

  if (typeof valor === "object") {
    return JSON.stringify(valor);
  }

  return String(valor);
}

function formatJson(valor: unknown): string {
  return JSON.stringify(valor ?? {}, null, 2);
}

function temDados(valor: unknown): boolean {
  if (valor === null || valor === undefined) {
    return false;
  }

  if (typeof valor === "object") {
    return Object.keys(valor as object).length > 0;
  }

  return true;
}

interface CopiarJsonButtonProps {
  label: string;
  valor: unknown;
}

function CopiarJsonButton({
  label,
  valor,
}: CopiarJsonButtonProps) {
  const [copiado, setCopiado] = useState(false);

  if (!temDados(valor)) {
    return null;
  }

  async function copiarJson() {
    try {
      await navigator.clipboard.writeText(formatJson(valor));

      setCopiado(true);

      setTimeout(() => {
        setCopiado(false);
      }, 1500);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-8 gap-1.5 text-xs"
      onClick={copiarJson}
    >
      {copiado ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}

      {copiado ? "Copiado" : label}
    </Button>
  );
}

export function AuditoriasTable({ data }: Props) {
  const [auditoriaSelecionada, setAuditoriaSelecionada] =
    useState<Auditoria | null>(null);

  const [modoDev, setModoDev] = useState(false);

  function abrirAuditoria(auditoria: Auditoria) {
    setAuditoriaSelecionada(auditoria);

    // Sempre abre no modo amigável.
    setModoDev(false);
  }

  function fecharAuditoria() {
    setAuditoriaSelecionada(null);
    setModoDev(false);
  }

  if (!data.length) {
    return (
      <Card className="flex items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">
          Nenhum registro encontrado
        </p>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-4">
      <Table >
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead  className="bold">Entidade</TableHead>

            <TableHead className="text-center">
              Ação
            </TableHead>

            <TableHead>
              Campos Alterados
            </TableHead>

            <TableHead>
              Usuário
            </TableHead>

            <TableHead className="text-center">
              Data
            </TableHead>

            <TableHead className="text-right">
              Ações
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody className="text-sm text-muted-foreground">
          {data.map((auditoria) => (
            <TableRow
              key={auditoria.id}
              className="border-b transition-colors last:border-0 even:bg-muted/20 hover:bg-muted/40"
            >
              <TableCell className="font-medium">
                {getAuditoriaEntidadeLabel(
                  auditoria.entidadeTabela
                )}
              </TableCell>

              <TableCell className="text-center">
                <Badge
                  className={getAuditoriaAcaoBadge(
                    auditoria.acao
                  )}
                >
                  {getAuditoriaAcaoLabel(
                    auditoria.acao
                  )}
                </Badge>
              </TableCell>

              <TableCell className="text-sm">
                {auditoria.camposAlterados?.length
                  ? auditoria.camposAlterados.join(", ")
                  : "---"}
              </TableCell>

              <TableCell className="font-medium">
                {auditoria.usuario?.nome ?? "Sistema"}
              </TableCell>

              <TableCell className="text-center">
                {formatDate(auditoria.criadoEm)}
              </TableCell>

              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => abrirAuditoria(auditoria)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {auditoriaSelecionada && (
        <Dialog
          open
          onOpenChange={fecharAuditoria}
        >
          <DialogContent className="flex max-h-[85vh] flex-col gap-0 bg-white p-0 dark:bg-zinc-900 sm:max-w-2xl lg:max-w-4xl">
            <DialogHeader className="shrink-0 border-b px-6 py-4 pr-12">
              <div className="flex items-center justify-between gap-4">
                <DialogTitle className="flex items-center gap-2">
                  {getAuditoriaEntidadeLabel(
                    auditoriaSelecionada.entidadeTabela
                  )}

                  <Badge
                    className={getAuditoriaAcaoBadge(
                      auditoriaSelecionada.acao
                    )}
                  >
                    {getAuditoriaAcaoLabel(
                      auditoriaSelecionada.acao
                    )}
                  </Badge>
                </DialogTitle>

                <div className="flex items-center gap-2">
                  {/* Copiar JSON Antes */}
                  <CopiarJsonButton
                    label="Copiar Antes"
                    valor={auditoriaSelecionada.dadosAntes}
                  />

                  {/* Copiar JSON Depois */}
                  <CopiarJsonButton
                    label="Copiar Depois"
                    valor={auditoriaSelecionada.dadosDepois}
                  />

                  {/* Modo desenvolvedor */}
                  <Button
                    type="button"
                    variant={modoDev ? "default" : "outline"}
                    size="sm"
                    className="h-8 gap-1.5 text-xs"
                    onClick={() =>
                      setModoDev((valor) => !valor)
                    }
                  >
                    <Code2 className="h-3.5 w-3.5" />
                    {"Desenvolvedor"}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <Info
                  label="Usuário"
                  value={
                    auditoriaSelecionada.usuario?.nome ??
                    "Sistema"
                  }
                />

                <Info
                  label="Data"
                  value={formatDate(
                    auditoriaSelecionada.criadoEm
                  )}
                />
              </div>
            </DialogHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
              {modoDev ? (
                /*
                 * =====================================================
                 * MODO DESENVOLVEDOR
                 * =====================================================
                 *
                 * Sempre mantém Antes e Depois.
                 * Mesmo que não exista conteúdo.
                 */
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* ANTES */}
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 dark:border-red-900/60 dark:bg-red-950/30">
                    <p className="mb-2 text-[11px] font-medium tracking-wide text-red-700 uppercase dark:text-red-400">
                      Antes
                    </p>

                    <pre className="max-h-[32rem] min-h-32 overflow-auto rounded-lg border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-400 p-3 text-xs leading-relaxed whitespace-pre-wrap break-words">
                      {temDados(
                        auditoriaSelecionada.dadosAntes
                      )
                        ? formatJson(
                            auditoriaSelecionada.dadosAntes
                          )
                        : "---"}
                    </pre>
                  </div>

                  {/* DEPOIS */}
                  <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-900/60 dark:bg-emerald-950/30">
                    <p className="mb-2 text-[11px] font-medium tracking-wide text-emerald-700 uppercase dark:text-emerald-400">
                      Depois
                    </p>

                    <pre className="max-h-[32rem] min-h-32 overflow-auto rounded-lg border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-400 p-3 text-xs leading-relaxed whitespace-pre-wrap break-words">
                      {temDados(
                        auditoriaSelecionada.dadosDepois
                      )
                        ? formatJson(
                            auditoriaSelecionada.dadosDepois
                          )
                        : "---"}
                    </pre>
                  </div>
                </div>
              ) : auditoriaSelecionada.camposAlterados
                  ?.length ? (
                /*
                 * =====================================================
                 * MODO NORMAL — ALTERAÇÃO
                 * =====================================================
                 *
                 * Mantido exatamente como estava.
                 */
                <div className="flex flex-col divide-y">
                  {auditoriaSelecionada.camposAlterados.map(
                    (campo) => (
                      <div
                        key={campo}
                        className="grid grid-cols-1 gap-2 py-3 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,10rem)_1fr]"
                      >
                        <p className="text-sm font-medium sm:pt-2">
                          {campo}
                        </p>

                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 dark:border-red-900/60 dark:bg-red-950/30">
                            <p className="mb-1 text-[11px] font-medium tracking-wide text-red-700 uppercase dark:text-red-400">
                              Antes
                            </p>

                            <p className="text-sm break-all text-red-950 dark:text-red-200">
                              {formatValor(
                                auditoriaSelecionada
                                  .dadosAntes?.[campo]
                              )}
                            </p>
                          </div>

                          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-900/60 dark:bg-emerald-950/30">
                            <p className="mb-1 text-[11px] font-medium tracking-wide text-emerald-700 uppercase dark:text-emerald-400">
                              Depois
                            </p>

                            <p className="text-sm break-all text-emerald-950 dark:text-emerald-200">
                              {formatValor(
                                auditoriaSelecionada
                                  .dadosDepois?.[campo]
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                /*
                 * =====================================================
                 * MODO NORMAL — CADASTRO / EXCLUSÃO / RECUPERAÇÃO
                 * =====================================================
                 *
                 * Mantido exatamente como estava.
                 */
                <div className="flex flex-col divide-y">
                  {Object.entries(
                    auditoriaSelecionada.acao ===
                      "EXCLUSAO"
                      ? auditoriaSelecionada.dadosAntes ??
                          {}
                      : auditoriaSelecionada.dadosDepois ??
                          auditoriaSelecionada.dadosAntes ??
                          {}
                  ).map(([campo, valor]) => (
                    <div
                      key={campo}
                      className="grid grid-cols-1 gap-2 py-3 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,10rem)_1fr]"
                    >
                      <p className="text-sm font-medium sm:pt-2">
                        {campo}
                      </p>

                      <div
                        className={`${getAuditoriaAcaoBadge(
                          auditoriaSelecionada.acao
                        )} rounded-md border px-3 py-2`}
                      >
                        <p className="text-sm break-all">
                          {formatValor(valor)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="shrink-0 border-t px-6 py-3">
              <div className="flex w-full items-center gap-6 text-xs text-muted-foreground">
                <span>
                  <span className="font-medium text-foreground">
                    IP:
                  </span>{" "}
                  {auditoriaSelecionada.ip ?? "---"}
                </span>

                <span>
                  <span className="font-medium text-foreground">
                    Origem:
                  </span>{" "}
                  {auditoriaSelecionada.origem}
                </span>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
