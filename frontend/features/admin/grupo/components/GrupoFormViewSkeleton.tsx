"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function GrupoFormViewSkeleton() {
  return (
    <Card className="w-full">
      <CardHeader>
        <Skeleton className="h-7 w-40" />
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Tabs */}
        <div className="grid w-full grid-cols-2 gap-2">
          <Skeleton className="h-10 rounded-md" />
          <Skeleton className="h-10 rounded-md" />
        </div>

        {/* Formulário */}
        <div className="rounded-xl border p-6">
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 md:col-span-4 space-y-2">
              <Skeleton className="h-4 w-24" />

              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>

        {/* Botão */}
        <div className="flex justify-end">
          <Skeleton className="h-10 w-40 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}