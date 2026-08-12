"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function MensagensTableSkeleton() {
  const rows = Array.from({ length: 5 });

  return (
    <div className="rounded-2xl border bg-background shadow-sm animate-pulse">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead>Título</TableHead>
            <TableHead>Direcionamento</TableHead>
            <TableHead className="text-center">Origem</TableHead>
            <TableHead className="text-center">Lidas</TableHead>
            <TableHead className="text-center">Enviado em</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {rows.map((_, index) => (
            <TableRow key={index}>
              <TableCell>
                <div className="h-4 w-48 rounded-md bg-muted" />
              </TableCell>
              <TableCell>
                <div className="h-4 w-32 rounded-md bg-muted" />
              </TableCell>
              <TableCell className="text-center">
                <div className="h-4 w-20 rounded-md bg-muted mx-auto" />
              </TableCell>
              <TableCell className="text-center">
                <div className="h-4 w-12 rounded-md bg-muted mx-auto" />
              </TableCell>
              <TableCell className="text-center">
                <div className="h-4 w-28 rounded-md bg-muted mx-auto" />
              </TableCell>
              <TableCell className="text-right">
                <div className="ml-auto h-8 w-8 rounded-md bg-muted" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
