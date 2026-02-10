"use client"

import { useState } from "react"

import Image from "next/image"
import { useRouter } from "next/navigation"

import axios from "axios"
import { Monitor, CircleAlert } from "lucide-react"

import { LoginForm } from "@/components/forms/login-form"
import {
  Alert,
  AlertTitle,
  AlertDescription
} from "@/components/ui/alert"

import { type LoginData } from "@/lib/validations/auth/login-schema"

type BackendErrorResponse = {
  errors?: Record<string, string[]>
}

export default function LoginPage() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const router = useRouter()

  async function handleSubmit(data: LoginData) {
    try {
      setFieldErrors({})

      await axios.post("/api/auth/admin/login", {
        email: data.email,
        senha: data.senha,
      })

      router.push("/admin/dashboard")
    } catch (err: unknown) {
      if (axios.isAxiosError<BackendErrorResponse>(err)) {
        const backendErrors = err.response?.data?.errors || {}
        setFieldErrors(backendErrors)
      } else {
        setFieldErrors({
          business: ["Erro interno desconhecido."]
        })
      }
    }
  }

  const businessErrors = fieldErrors.business ?? []

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <Monitor className="size-4" />
            </div>
            Área Administrativa
          </a>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">

            {businessErrors.length > 0 && (
              <Alert variant="destructive" className="relative mb-8">
                <CircleAlert className="h-5 w-5" />
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>
                  <ul className="list-inside list-disc text-sm">
                    {businessErrors.map((msg, i) => (
                      <li key={i}>{msg}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            <LoginForm
              onSubmit={handleSubmit}
              fieldErrors={fieldErrors}
            />

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
