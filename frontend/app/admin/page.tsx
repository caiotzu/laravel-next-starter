"use client"

import { useState } from "react"

import Image from "next/image"
import { useRouter } from "next/navigation"

import axios from "axios"
import { Monitor, Loader2 } from "lucide-react"

import { AppAlert } from "@/components/feedback/AppAlert"
import { LoginForm } from "@/components/forms/login-form"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp"

import { type LoginData } from "@/lib/validations/auth/login-schema"

type BackendErrorResponse = {
  errors?: Record<string, string[]>
}

type LoginResponse =
  | {
      "2fa_enable": true
      temp_token: string
    }
  | {
      "2fa_enable": false
      token: string
      expires_in: number
    }

type LoginProxyResponse = {
  status: number
  data: LoginResponse
}

export default function LoginPage() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [isLoading, setIsLoading] = useState(false)

  const [requires2FA, setRequires2FA] = useState(false)
  const [tempToken, setTempToken] = useState<string | null>(null)
  const [codigo, setCodigo] = useState("")

  const router = useRouter()

  /* ================= LOGIN ================= */

  async function handleSubmit(data: LoginData) {
    try {
      setIsLoading(true)
      setFieldErrors({})

      const response = await axios.post<LoginProxyResponse>(
        "/api/auth/admin/login",
        {
          email: data.email,
          senha: data.senha,
        }
      )

      const payload = response.data.data

      if (payload["2fa_enable"]) {
        setRequires2FA(true)
        setTempToken(payload.temp_token)
        return
      }

      // Se não tem 2FA, login já foi feito e cookie já foi setado
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
    } finally {
      setIsLoading(false)
    }
  }

  /* ================= VERIFICAR 2FA ================= */

  async function handleVerify2FA() {
    if (!tempToken) return

    try {
      setIsLoading(true)
      setFieldErrors({})

      await axios.post<LoginProxyResponse>(
        "/api/auth/admin/2fa",
        {
          temp_token: tempToken,
          codigo,
        }
      )

      // Se chegou aqui, proxy já setou cookie
      router.push("/admin/dashboard")

    } catch (err: unknown) {
      if (axios.isAxiosError<BackendErrorResponse>(err)) {
        const backendErrors = err.response?.data?.errors || {}
        setFieldErrors(backendErrors)
      } else {
        setFieldErrors({
          business: ["Erro ao validar código."]
        })
      }
    } finally {
      setIsLoading(false)
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
          <div className="w-full max-w-[450px]">
            <Card className="rounded-2xl p-8">
              {businessErrors.length > 0 && (
                <AppAlert
                  variant="error"
                  subtitle="Ocorreu um erro durante a autenticação"
                  messages={businessErrors}
                  onClose={() => setFieldErrors({})}
                  className="mb-6"
                />
              )}

              {!requires2FA && (
                <LoginForm
                  onSubmit={handleSubmit}
                  fieldErrors={fieldErrors}
                />
              )}

              {requires2FA && (
                <div className="space-y-6">

                  <div className="text-center space-y-2">
                    <h2 className="text-lg font-semibold">
                      Autenticação em Dois Fatores
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Digite o código do seu aplicativo autenticador.
                    </p>
                  </div>

                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={codigo}
                      onChange={setCodigo}
                    >
                      <InputOTPGroup>
                        {[...Array(6)].map((_, i) => (
                          <InputOTPSlot key={i} index={i} />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <Button
                    className="w-full"
                    onClick={handleVerify2FA}
                    disabled={codigo.length !== 6 || isLoading}
                  >
                    {isLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Validar Código
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setRequires2FA(false)
                      setTempToken(null)
                      setCodigo("")
                    }}
                  >
                    Voltar
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