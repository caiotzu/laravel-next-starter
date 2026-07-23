import { Monitor } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function SessoesSectionSkeleton() {
  return (
    <Card className="rounded-2xl h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Monitor size={18} />
          Sessões
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="border rounded-xl p-3 space-y-2">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-8 w-24" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
