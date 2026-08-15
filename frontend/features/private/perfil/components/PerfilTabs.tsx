"use client";

import { User, Shield } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Usuario } from "@/domains/private/perfil/usuario/types/usuario.model";

import { PerfilTabContent } from "./PerfilTabContent";
import { SegurancaTabContent } from "./SegurancaTabContent";


interface Props {
  user: Usuario;
}

export function PerfilTabs({ user }: Props) {
  return (
    <Tabs defaultValue="perfil" className="w-full space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="perfil" className="flex items-center gap-2">
          <User size={16} />
          Perfil
        </TabsTrigger>

        <TabsTrigger value="seguranca" className="flex items-center gap-2">
          <Shield size={16} />
          Segurança
        </TabsTrigger>
      </TabsList>

      <TabsContent value="perfil">
        <PerfilTabContent user={user} />
      </TabsContent>

      <TabsContent value="seguranca">
        <SegurancaTabContent twoFactorEnabled={user.google2fa_enable}/>
      </TabsContent>
    </Tabs>
  );
}
