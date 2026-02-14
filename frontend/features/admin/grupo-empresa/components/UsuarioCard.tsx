import Image from "next/image";

import { MoreHorizontal, User } from "lucide-react";

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
      className={`relative rounded-xl shadow-sm border-l-4 ${
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
        <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
          {usuario.avatar ? (
            <Image
              src={usuario.avatar}
              alt={usuario.nome}
              width={48}
              height={48}
              className="h-full w-full object-cover"
            />
          ) : (
            <User className="h-6 w-6 text-gray-400" />
          )}
        </div>
      </div>

      <div className="text-center mb-2">
        <p className="font-medium text-sm">{usuario.nome}</p>
        <p className="text-xs text-muted-foreground truncate">
          {usuario.email}
        </p>
      </div>

      <div className="text-xs space-y-1">
        <p>
          <span className="font-medium text-black">Criado:</span>{" "}
          <span className="text-muted-foreground">
            {formatDate(usuario.created_at)}
          </span>
        </p>

        <p>
          <span className="font-medium text-black">Ultimo Acesso:</span>{" "}
          <span className="text-muted-foreground">
            {/* {formatDate(usuario.created_at)} */}
            ---
          </span>
        </p>

        <p>
          <span className="font-medium text-black">2FA:</span>{" "}
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
