"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function UsuarioViewSkeleton() {
  return (
    <div className="rounded-xl shadow-sm border-l-4 bg-card p-6">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-10 p-8">
        {/* Avatar */}
        <div className="relative">
          <Skeleton className="h-28 w-28 rounded-full" />
        </div>

        {/* Informações */}
        <div className="flex-1 w-full space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-5 w-80" />
          </div>

          <div className="flex flex-wrap gap-16">
            {/* Grupo */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-40" />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-24" />
            </div>

            {/* 2FA habilitado */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-12" />
            </div>

            {/* 2FA habilitado em */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-28" />
            </div>

            {/* Último login */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-36" />
            </div>

            {/* Último IP */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-32" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}