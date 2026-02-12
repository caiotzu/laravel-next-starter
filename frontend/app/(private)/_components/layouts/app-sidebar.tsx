"use client"

import * as React from "react"


import {
  FolderKanban,
  Command,
  Settings2,
} from "lucide-react"

import { NavMain } from "@/app/(private)/_components/layouts/nav-main"
import { NavUser } from "@/app/(private)/_components/layouts/nav-user"

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

import { useUserPrivate } from "@/hooks/use-user-private"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: ''//"/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Configurações",
      url: "#",
      icon: Settings2,
      isActive: true,
      items: [
        {
          title: "Empresas",
          url: "#",
        },
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
  const { data: userPrivate, isLoading } = useUserPrivate();

  const user = {
    name: userPrivate?.nome || 'shadcn',
    email: userPrivate?.email || 'm@example.com',
    avatar: ''//"/avatars/shadcn.jpg",
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
