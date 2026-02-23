"use client";

import { Camera, User } from "lucide-react";

import { Usuario } from "@/types/usuario.model";

import { Info } from "@/components/common/Info";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useAvatarUpload } from "@/domain/admin/perfil/hooks/useAvatarUpload";
import { formatDate } from "@/lib/utils";


interface Props {
  user: Usuario;
}

export function PerfilHeaderCard({ user }: Props) {
  const {
    avatar,
    uploading,
    handleAvatarChange,
  } = useAvatarUpload(user.avatar);

  return (
    <div
      className={`rounded-xl shadow-sm border-l-4 bg-card p-6 ${
        user.ativo
          ? "border-emerald-500"
          : "border-red-500"
      }`}
    >
      <div className="flex flex-col md:flex-row items-center md:items-start gap-10 p-8">
        
        {/* Avatar */}
        <div className="relative group">
          <div className="relative">
            <Avatar className="h-28 w-28 transition-all duration-300 group-hover:scale-105">
              <AvatarImage src={avatar ?? undefined} />
              <AvatarFallback>
                <User className="h-12 w-12" />
              </AvatarFallback>
            </Avatar>

            {/* Overlay loading */}
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full backdrop-blur-sm">
                <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          <label
            htmlFor="avatar-upload"
            className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 shadow-md cursor-pointer transition hover:scale-105 disabled:opacity-50"
          >
            <Camera className="h-4 w-4" />
          </label>

          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
            disabled={uploading}
          />
        </div>

        {/* Informações */}
        <div className="flex-1 w-full space-y-6">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">
              {user.nome}
            </h2>
            <p className="text-muted-foreground">
              {user.email}
            </p>
          </div>

          <div className="flex flex-wrap gap-16">
            <Info label="Grupo" value={user.grupo} />

            <Info
              label="2FA habilitado"
              value={user.google2fa_enable ? "Sim" : "Não"}
            />

            <Info
              label="2FA habilitado em"
              value={
                user.google2fa_confirmado_em
                  ? formatDate(user.google2fa_confirmado_em)
                  : "---"
              }
            />

            <Info
              label="Último login"
              value={
                user.ultimo_login_em
                  ? formatDate(user.ultimo_login_em)
                  : "---"
              }
            />

            <Info
              label="Último IP"
              value={user.ultimo_ip ?? "---"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
