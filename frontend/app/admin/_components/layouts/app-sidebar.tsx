"use client"

import * as React from "react"

import {
  FolderKanban,
  Command,
  Settings2,
} from "lucide-react"

import { NavMain } from "@/app/admin/_components/layouts/nav-main"
import { NavUser } from "@/app/admin/_components/layouts/nav-user"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

import { useUserAdmin } from "@/hooks/use-user-admin"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: userAdmin } = useUserAdmin();
  
  const navMain = [
    {
      title: "Cadastros",
      url: "#",
      icon: FolderKanban,
      items: [
        {
          title: "Grupos Empresas",
          url: "/admin/grupos-empresas",
          permission: "admin.grupo_empresa.menu"
        },
        {
          title: "Empresas",
          url: "#",
          permission: null
        },
      ],
    },
    {
      title: "Configurações",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "Grupos",
          url: "#",
          permission: null
        },
        {
          title: "Usuários",
          url: "#",
          permission: null
        },
      ],
    }
  ]
  
  const user = {
    name: userAdmin?.nome || 'shadcn',
    email: userAdmin?.email || 'm@example.com',
    avatar: userAdmin?.avatar || '',
  };

  return (
    <Sidebar variant="inset" collapsible="icon" {...props} >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Caio</span>
                  <span className="truncate text-xs">Enterprise</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
