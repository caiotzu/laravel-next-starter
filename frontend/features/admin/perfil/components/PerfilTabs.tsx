"use client";

import { User, Shield, Bell } from "lucide-react";

import { Usuario } from "@/types/usuario.model";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { NotificacoesTabContent } from "./NotificacoesTabContent";
import { PerfilTabContent } from "./PerfilTabContent";
import { SegurancaTabContent } from "./SegurancaTabContent";

interface Props {
  user: Usuario;
}

export function PerfilTabs({ user }: Props) {
  return (
    <Tabs defaultValue="perfil" className="w-full space-y-6">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="perfil" className="flex items-center gap-2">
          <User size={16} />
          Perfil
        </TabsTrigger>

        <TabsTrigger value="seguranca" className="flex items-center gap-2">
          <Shield size={16} />
          Segurança
        </TabsTrigger>

        <TabsTrigger value="notificacoes" className="flex items-center gap-2">
          <Bell size={16} />
          Notificações
        </TabsTrigger>
      </TabsList>

      <TabsContent value="perfil">
        <PerfilTabContent user={user} />
      </TabsContent>

      <TabsContent value="seguranca">
        <SegurancaTabContent twoFactorEnabled={user.google2fa_enable}/>
      </TabsContent>

      <TabsContent value="notificacoes">
        <NotificacoesTabContent />
      </TabsContent>
    </Tabs>
  );
}
