"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function GruposTableSkeleton() {
  return (
    <Card className="w-full rounded-2xl border shadow-sm p-0 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-primary hover:bg-primary border-b border-white/10">
            <TableHead>
              <Skeleton className="h-4 w-32 bg-primary-foreground/20" />
            </TableHead>

            <TableHead className="text-center">
              <Skeleton className="h-4 w-28 mx-auto bg-primary-foreground/20" />
            </TableHead>

            <TableHead className="text-center">
              <Skeleton className="h-4 w-20 mx-auto bg-primary-foreground/20" />
            </TableHead>

            <TableHead className="text-right">
              <Skeleton className="h-4 w-16 ml-auto bg-primary-foreground/20" />
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {Array.from({ length: 5 }).map((_, index) => (
            <TableRow
              key={index}
              className="border-b last:border-0 even:bg-muted/20"
            >
              {/* Descrição */}
              <TableCell>
                <Skeleton className="h-4 w-56" />
              </TableCell>

              {/* Criado em */}
              <TableCell className="text-center">
                <Skeleton className="h-4 w-40 mx-auto" />
              </TableCell>

              {/* Status */}
              <TableCell className="text-center">
                <Skeleton className="h-6 w-20 mx-auto rounded-full" />
              </TableCell>

              {/* Ações */}
              <TableCell className="text-right">
                <Skeleton className="h-8 w-8 rounded-md ml-auto" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}