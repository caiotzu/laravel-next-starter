"use client"

import { useState } from "react"

import Image from "next/image"
import { useRouter } from "next/navigation"

import axios from "axios"
import { Monitor } from "lucide-react"

import { AppAlert } from "@/components/feedback/AppAlert"
import { EsqueceuSenhaForm } from "@/components/forms/esqueceu-senha-form"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

import { type EsqueceuSenhaData } from "@/lib/validations/auth/esqueceu-senha-schema"

type BackendErrorResponse = {
  errors?: Record<string, string[]>
}

export default function EsqueceuSenhaPage() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [emailSent, setEmailSent] = useState<string | null>(null)

  const router = useRouter()

  async function handleSubmit(data: EsqueceuSenhaData) {
    try {
      setFieldErrors({})

      await axios.post("/api/auth/private/esqueceu-senha", {
        email: data.email,
      })

      setEmailSent(data.email)
    } catch (err: unknown) {
      if (axios.isAxiosError<BackendErrorResponse>(err)) {
        const backendErrors = err.response?.data?.errors || {}
        setFieldErrors(backendErrors)
      } else {
        setFieldErrors({
          business: ["Erro interno desconhecido."],
        })
      }
    }
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <Monitor className="size-4" />
            </div>
            Área Privada
          </a>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-[450px]">
            <Card className="rounded-2xl p-8">
              {!emailSent && (
                <div className="space-y-5">
                  <EsqueceuSenhaForm
                    onSubmit={handleSubmit}
                    fieldErrors={fieldErrors}
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => router.push("/")}
                  >
                    Voltar ao login
                  </Button>
                </div>
              )}

              {emailSent && (
                <div className="space-y-6">
                  <AppAlert
                    variant="success"
                    subtitle="E-mail enviado com sucesso"
                    messages={[
                      `Enviamos as instruções de recuperação para ${emailSent}.`,
                    ]}
                  />

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push("/")}
                  >
                    Voltar ao login
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      <div className="bg-muted flex flex-1 items-center justify-center hidden lg:block">
        <Image
          src="/next.svg"
          alt="logo"
          width={100}
          height={100}
          className="inset-0 px-32 h-full w-full dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  )
}
