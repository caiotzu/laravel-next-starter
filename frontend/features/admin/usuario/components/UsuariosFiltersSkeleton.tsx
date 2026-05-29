"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function UsuariosFiltersSkeleton() {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <Skeleton className="h-6 w-24" />
      </CardHeader>

      <CardContent className="flex flex-wrap gap-4 items-end">
        {/* Nome */}
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-64 rounded-md" />
        </div>

        {/* Grupo */}
        <div className="flex flex-col gap-2 w-64">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>

        {/* Per Page */}
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-28 rounded-md" />
        </div>

        {/* Switch */}
        <div className="flex items-center space-x-2 pb-2">
          <Skeleton className="h-6 w-11 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}