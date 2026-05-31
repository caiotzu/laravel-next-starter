import { MoreHorizontal, User } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { getUsuarioStatusBorder } from "@/constants/usuario-status";
import { Usuario } from "@/domains/admin/usuario/types/usuario.model";
import { formatDate } from "@/lib/utils";

interface Props {
  usuario: Usuario;
}
export function UsuarioCard({ usuario }: Props) {
  return (
    <div
      className={`relative rounded-xl shadow-sm border-l-4 bg-card ${getUsuarioStatusBorder( usuario.status )} p-3`}
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
            {formatDate(usuario.createdAt)}
          </span>
        </p>

        <p>
          <span className="font-medium text-foreground">Último Acesso:</span>{" "}
          <span className="text-muted-foreground">
            ---
          </span>
        </p>
        <p>
          <span className="font-medium text-foreground">Status:</span>{" "}
          <span className="text-muted-foreground">
            {usuario.status}
          </span>
        </p>

        <p>
          <span className="font-medium text-foreground">2FA:</span>{" "}
          <span className="text-muted-foreground">
            {usuario.google2faEnable
              ? "Ativado"
              : "Desativado"}
          </span>
        </p>
      </div>
    </div>
  );
}