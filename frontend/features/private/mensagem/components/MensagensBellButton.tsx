"use client";

import { useState } from "react";

import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useContadorMensagensNaoLidas } from "@/domains/private/mensagem/hooks/useContadorMensagensNaoLidas";

import { MensagensSheet } from "./MensagensSheet";

export function MensagensBellButton() {
  const [open, setOpen] = useState(false);

  const { data: totalNaoLidas = 0 } = useContadorMensagensNaoLidas();

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="relative cursor-pointer"
        aria-label="Mensagens"
        onClick={() => setOpen(true)}
      >
        <Bell className="h-4 w-4" />

        {totalNaoLidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-medium leading-none text-white">
            {totalNaoLidas > 99 ? "99+" : totalNaoLidas}
          </span>
        )}
      </Button>

      <MensagensSheet open={open} onOpenChange={setOpen} />
    </>
  );
}
