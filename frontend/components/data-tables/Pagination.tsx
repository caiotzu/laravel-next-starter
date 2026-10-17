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
    <Card className="w-full rounded-2xl border shadow-sm p-3">

      <div className="flex items-center justify-between">
        {/* ESQUERDA */}
        <div className="text-sm text-muted-foreground">
          Mostrando <strong>{from}</strong>–<strong>{to}</strong> de{" "}
          <strong>{total}</strong> resultados
        </div>

        {/* DIREITA */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
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
                className="cursor-pointer"
              >
                {item}
              </Button>
            ) : (
              <span key={item} aria-hidden="true" className="px-1 text-muted-foreground select-none">
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
            Próximo
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
