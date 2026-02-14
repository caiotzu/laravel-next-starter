"use client";

import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function GrupoEmpresaFormEdicaoSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
      </div>
      
      <Card className="w-full">
        <CardHeader className="space-y-2">
          <Skeleton className="h-6 w-64" />
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 md:col-span-4 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-3">
          <Skeleton className="h-10 w-24 rounded-md" />
          <Skeleton className="h-10 w-40 rounded-md" />
        </CardFooter>
      </Card>
    </div>
  );
}
