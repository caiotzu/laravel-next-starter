"use client"

import * as React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { ChevronRight, type LucideIcon } from "lucide-react"

import { useAdminPermission } from "@/app/admin/providers/admin-permission-provider"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

import { cn } from "@/lib/utils"


type SubItem = {
  title: string
  url: string
  permission?: string | null
}

type Item = {
  title: string
  icon?: LucideIcon
  items?: SubItem[]
}

export function NavMain({ items }: { items: Item[] }) {
  const pathname = usePathname();
  const { can, isLoading } = useAdminPermission();

  const [openMenus, setOpenMenus] = React.useState<string[]>([])

  // Abre automaticamente o menu que contém a rota ativa
  React.useEffect(() => {
    const activeParents = items
      .filter((item) =>
        item.items?.some((subItem) =>
          pathname.startsWith(subItem.url)
        )
      )
      .map((item) => item.title)

    setOpenMenus((prev) => [
      ...new Set([...prev, ...activeParents]),
    ])
  }, [pathname, items])

  function toggleMenu(title: string) {
    setOpenMenus((prev) =>
      prev.includes(title)
        ? prev.filter((t) => t !== title)
        : [...prev, title]
    )
  }

  if (isLoading) return null

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => {

          // Filtra filhos por permissão
          const visibleSubItems =
            item.items?.filter((subItem) => {
              if (!subItem.permission) return true
              return can(subItem.permission)
            }) ?? []

          // Se não houver filhos visíveis, não renderiza o menu pai
          if (visibleSubItems.length === 0) return null

          const isOpen = openMenus.includes(item.title)

          return (
            <Collapsible
              key={item.title}
              open={isOpen}
              onOpenChange={() => toggleMenu(item.title)}
              className="group/collapsible"
            >
              <SidebarMenuItem>

                {/* MENU PAI */}
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>

                {/* SUBMENUS */}
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {visibleSubItems.map((subItem) => {

                      const isActive =
                        subItem.url !== "#" &&
                        pathname.startsWith(subItem.url)

                      return (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            className={cn(
                              isActive &&
                                "bg-sidebar-accent text-sidebar-accent-foreground"
                            )}
                          >
                            <Link href={subItem.url}>
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>

              </SidebarMenuItem>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
