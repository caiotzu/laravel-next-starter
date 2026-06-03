"use client"

import { useEffect, useState } from "react"

import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"

import axios from "axios"
import { Loader2, Monitor } from "lucide-react"

import { AppAlert } from "@/components/feedback/AppAlert"
import { RedefinirSenhaForm } from "@/components/forms/redefinir-senha-form"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

import { type RedefinirSenhaData } from "@/lib/validations/auth/redefinir-senha-schema"

type BackendErrorResponse = {
  errors?: Record<string, string[]>
}

type ResetSenhaValidacao = {
  valid?: boolean
  valido?: boolean
  is_valid?: boolean
}

type ResetSenhaValidacaoResponse = {
  status: number
  data: ResetSenhaValidacao
}

export default function RedefinirSenhaPage() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [isValidating, setIsValidating] = useState(true)
  const [tokenIsValid, setTokenIsValid] = useState(false)
  const [validationMessage, setValidationMessage] = useState<string | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  useEffect(() => {
    let isActive = true

    async function validateToken() {
      if (!token) {
        if (!isActive) return

        setTokenIsValid(false)
        setValidationMessage("Token não informado na URL.")
        setIsValidating(false)
        return
      }

      try {
        setIsValidating(true)
        setFieldErrors({})
        setValidationMessage(null)

        const response = await axios.get<ResetSenhaValidacaoResponse>(
          "/api/auth/admin/redefinir-senha/validar",
          {
            params: { token },
          }
        )

        const payload = response.data.data
        const isValid =
          payload?.valid ??
          payload?.valido ??
          payload?.is_valid ??
          true

        if (!isActive) return

        setTokenIsValid(Boolean(isValid))

        if (!isValid) {
          setValidationMessage("Link inválido ou expirado.")
        }
      } catch (err: unknown) {
        if (!isActive) return

        setTokenIsValid(false)

        if (axios.isAxiosError<BackendErrorResponse>(err)) {
          const backendErrors = err.response?.data?.errors || {}
          const businessErrors = backendErrors.business ?? []

          setValidationMessage(
            businessErrors[0] ?? "Não foi possível validar o link."
          )
          setFieldErrors(backendErrors)
        } else {
          setValidationMessage("Não foi possível validar o link.")
        }
      } finally {
        if (isActive) {
          setIsValidating(false)
        }
      }
    }

    validateToken()

    return () => {
      isActive = false
    }
  }, [token])

  async function handleSubmit(data: RedefinirSenhaData) {
    if (!token) {
      setFieldErrors({
        business: ["Token não informado na URL."],
      })
      return
    }

    try {
      setFieldErrors({})

      await axios.post("/api/auth/admin/redefinir-senha", {
        token,
        senha: data.senha,
        senha_confirma: data.senha_confirma,
      })

      router.push("/admin?toast=redefinir-senha")
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
            Área Administrativa
          </a>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-[450px]">
            <Card className="rounded-2xl p-8">
              {isValidating && (
                <div className="flex flex-col items-center justify-center gap-3 py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <p className="text-sm text-muted-foreground">
                    Validando link de redefinição de senha...
                  </p>
                </div>
              )}

              {!isValidating && !tokenIsValid && (
                <div className="space-y-6">
                  <AppAlert
                    variant="error"
                    subtitle="Não foi possível liberar o acesso"
                    messages={[validationMessage ?? "Link inválido ou expirado."]}
                    className="mb-6"
                  />

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push("/admin")}
                  >
                    Voltar ao login
                  </Button>
                </div>
              )}

              {!isValidating && tokenIsValid && (
                <div className="space-y-6">
                  <RedefinirSenhaForm
                    onSubmit={handleSubmit}
                    fieldErrors={fieldErrors}
                  />
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
