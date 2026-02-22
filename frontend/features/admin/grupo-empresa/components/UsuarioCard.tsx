import { MoreHorizontal, User } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { VisualizarGrupoEmpresaResponse } from "../types/grupoEmpresa.responses";

interface UsuarioCardProps {
  usuario: VisualizarGrupoEmpresaResponse["grupos"][number]["usuarios"][number];
  formatDate: (date?: string | null) => string;
}

export function UsuarioCard({ usuario, formatDate }: UsuarioCardProps) {
  return (
    <div
      className={`relative rounded-xl shadow-sm border-l-4 bg-card ${
        usuario.deleted_at || !usuario.ativo
          ? "border-red-500"
          : "border-emerald-500"
      } p-3`}
    >
      <div className="absolute top-2 right-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem>Resetar senha</DropdownMenuItem>
            <DropdownMenuItem>Desativar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex justify-center mb-2">
        <div className="h-18 w-18 rounded-full bg-muted flex items-center justify-center overflow-hidden">
          <Avatar className="h-18 w-18 transition-all duration-300 group-hover:scale-105">
            <AvatarImage src={usuario.avatar ?? undefined} />
            <AvatarFallback>
                <User className="h-6 w-6 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div className="text-center mb-2">
        <p className="font-medium text-sm text-foreground">
          {usuario.nome}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {usuario.email}
        </p>
      </div>

      <div className="text-xs space-y-1">
        <p>
          <span className="font-medium text-foreground">Criado:</span>{" "}
          <span className="text-muted-foreground">
            {formatDate(usuario.created_at)}
          </span>
        </p>

        <p>
          <span className="font-medium text-foreground">Último Acesso:</span>{" "}
          <span className="text-muted-foreground">
            ---
          </span>
        </p>

        <p>
          <span className="font-medium text-foreground">2FA:</span>{" "}
          <span className="text-muted-foreground">
            {usuario.google2fa_enable
              ? "Ativado"
              : "Desativado"}
          </span>
        </p>
      </div>
    </div>
  );
}