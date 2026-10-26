"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { gerarPaginas } from "./pagination-pages";

interface PaginationProps {
  currentPage: number;
  lastPage: number;
  total: number;
  from: number | null;
  to: number | null;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  lastPage,
  total,
  from,
  to,
  onPageChange,
}: PaginationProps) {
  if (lastPage <= 1) return null;

  return (
    <Card className="w-full min-w-0 rounded-2xl border shadow-sm p-3">

      {/* Mobile: resumo em cima e controles embaixo, centralizados; a partir de sm: lado a lado */}
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
        {/* ESQUERDA */}
        <div className="text-center text-sm text-muted-foreground sm:text-left">
          Mostrando <strong>{from}</strong>–<strong>{to}</strong> de{" "}
          <strong>{total}</strong> resultados
        </div>

        {/* DIREITA */}
        <div className="flex max-w-full flex-wrap items-center justify-center gap-1 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4 sm:mr-1" />
            {/* No mobile só o ícone; o nome acessível continua "Anterior" */}
            <span className="sr-only sm:not-sr-only">Anterior</span>
          </Button>

          {gerarPaginas(currentPage, lastPage).map((item) =>
            typeof item === "number" ? (
              <Button
                key={item}
                size="sm"
                variant={item === currentPage ? "default" : "outline"}
                onClick={() => onPageChange(item)}
                aria-current={item === currentPage ? "page" : undefined}
                aria-label={
                  item === 1 && currentPage !== 1
                    ? "Ir para a primeira página"
                    : item === lastPage && currentPage !== lastPage
                      ? `Ir para a última página (${lastPage})`
                      : `Ir para a página ${item}`
                }
                className="min-w-8 cursor-pointer px-2 sm:px-3"
              >
                {item}
              </Button>
            ) : (
              <span key={item} aria-hidden="true" className="px-0.5 sm:px-1 text-muted-foreground select-none">
                …
              </span>
            )
          )}

          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === lastPage}
            onClick={() => onPageChange(currentPage + 1)}
            className="cursor-pointer"
          >
            <span className="sr-only sm:not-sr-only">Próximo</span>
            <ChevronRight className="h-4 w-4 sm:ml-1" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
