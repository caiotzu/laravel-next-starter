"use client";

import { Camera, User } from "lucide-react";

import { Info } from "@/components/common/Info";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { getUsuarioStatusBorder, getUsuarioStatusLabel } from "@/constants/usuario-status";
import { Usuario } from "@/domains/admin/usuario/types/usuario.model";
import { formatDate } from "@/lib/utils";

interface Props {
    usuario: Usuario
}

export default function UsuarioView(
	{usuario} : Props
) {
	return (
    <div
      className={`rounded-xl shadow-sm border-l-4 bg-card p-6 ${getUsuarioStatusBorder( usuario.status )}`}
    >
      <div className="flex flex-col md:flex-row items-center md:items-start gap-10 p-8">

				{/* Avatar */}
        <div className="relative group">
          <div className="relative">
            <Avatar className="h-28 w-28 transition-all duration-300 group-hover:scale-105">
              <AvatarImage src={usuario.avatar ?? undefined} />
              <AvatarFallback>
                <User className="h-12 w-12" />
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Informações */}
        <div className="flex-1 w-full space-y-6">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">
              {usuario.nome}
            </h2>
            <p className="text-muted-foreground">
              {usuario.email}
            </p>
          </div>

          <div className="flex flex-wrap gap-16">
            <Info label="Grupo" value={usuario.grupo?.descricao ?? '---'} />

            <Info label="Status" value={getUsuarioStatusLabel(usuario.status)} />

            <Info
              label="2FA habilitado"
              value={usuario.google2faEnable ? "Sim" : "Não"}
            />

            <Info
              label="2FA habilitado em"
              value={
                usuario.google2faConfirmadoEm
                  ? formatDate(usuario.google2faConfirmadoEm)
                  : "---"
              }
            />

            <Info
              label="Último login"
              value={
                usuario.ultimoLoginEm
                  ? formatDate(usuario.ultimoLoginEm)
                  : "---"
              }
            />

            <Info
              label="Último IP"
              value={usuario.ultimoIp ?? "---"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}