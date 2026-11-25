"use client";

import { Suspense, useEffect, useRef } from "react";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { User, Shield, Link2 } from "lucide-react";
import { toast } from "sonner";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Usuario } from "@/domains/private/perfil/usuario/types/usuario.model";
import { interpretarResultadoVinculo } from "@/lib/social/social";

import { LoginSocialTabContent } from "./LoginSocialTabContent";
import { PerfilTabContent } from "./PerfilTabContent";
import { SegurancaTabContent } from "./SegurancaTabContent";

interface Props {
  user: Usuario;
}

const ABA_LOGIN_SOCIAL = "login-social";

export function PerfilTabs(props: Props) {
  // useSearchParams exige Suspense (o retorno do provedor chega com ?aba=...&vinculo=...).
  return (
    <Suspense fallback={null}>
      <PerfilTabsConteudo {...props} />
    </Suspense>
  );
}

function PerfilTabsConteudo({ user }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const avisoExibidoRef = useRef(false);

  // Abre direto na aba "Login social" quando o BFF devolve do provedor.
  const abaInicial = searchParams.get("aba") === ABA_LOGIN_SOCIAL ? ABA_LOGIN_SOCIAL : "perfil";

  // Resultado do vínculo (?vinculo=...): mostra o aviso uma vez e limpa a URL.
  useEffect(() => {
    const resultado = interpretarResultadoVinculo(searchParams.get("vinculo"));

    if (!resultado || avisoExibidoRef.current) return;

    avisoExibidoRef.current = true;

    if (resultado.tipo === "sucesso") toast.success(resultado.mensagem);
    else toast.error(resultado.mensagem);

    router.replace(pathname);
  }, [pathname, router, searchParams]);

  return (
    <Tabs defaultValue={abaInicial} className="w-full space-y-6">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="perfil" className="flex items-center gap-2">
          <User size={16} />
          Perfil
        </TabsTrigger>

        <TabsTrigger value="seguranca" className="flex items-center gap-2">
          <Shield size={16} />
          Segurança
        </TabsTrigger>

        <TabsTrigger value={ABA_LOGIN_SOCIAL} className="flex items-center gap-2">
          <Link2 size={16} />
          Login social
        </TabsTrigger>
      </TabsList>

      <TabsContent value="perfil">
        <PerfilTabContent user={user} />
      </TabsContent>

      <TabsContent value="seguranca">
        <SegurancaTabContent twoFactorEnabled={user.google2fa_enable}/>
      </TabsContent>

      <TabsContent value={ABA_LOGIN_SOCIAL}>
        <LoginSocialTabContent />
      </TabsContent>
    </Tabs>
  );
}
