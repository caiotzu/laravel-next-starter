import { ModeToggle } from "@/components/ui/mode-toggle"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

import { CaixaMensagensBellButton } from "@/features/admin/mensagem/components/CaixaMensagensBellButton"

import { SupportModeBanner } from "./support-mode-banner"

export function SiteHeader() {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center border-b bg-background">
      <div className="flex w-full min-w-0 items-center gap-2 px-4 lg:px-6">
        {/* Menu */}
        <SidebarTrigger className="-ml-1 shrink-0" />

        <Separator
          orientation="vertical"
          className="mx-1 h-4 shrink-0"
        />

        {/* Título */}
        <h1 className="shrink-0 text-base font-medium">
          Painel administrativo
        </h1>

        {/* Suporte */}
        <div className="ml-2 min-w-0 flex-1">
          <SupportModeBanner />
        </div>

        {/* Ações */}
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <CaixaMensagensBellButton />
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}