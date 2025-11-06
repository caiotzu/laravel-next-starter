"use client"

import * as React from "react"
import { useUserAdmin } from "@/hooks/use-user-admin"

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

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Cadastros",
      url: "#",
      icon: FolderKanban,
      isActive: true,
      items: [
        {
          title: "Grupos Empresas",
          url: "#",
        },
        {
          title: "Empresas",
          url: "#",
        },
      ],
    },
    {
      title: "Configurações",
      url: "#",
      icon: Settings2,
      isActive: true,
      items: [
        {
          title: "Grupos",
          url: "#",
        },
        {
          title: "Usuários",
          url: "#",
        },
      ],
    }
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: userAdmin, isLoading } = useUserAdmin();
  
  const user = {
    name: userAdmin?.nome || 'shadcn',
    email: userAdmin?.email || 'm@example.com',
    avatar: "/avatars/shadcn.jpg",
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
        <NavMain items={data.navMain} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
