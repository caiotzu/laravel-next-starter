"use client"

import { useEffect } from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useForm, type UseFormSetError } from "react-hook-form"

import { AppAlert } from "@/components/feedback/AppAlert"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

import {
  esqueceuSenhaSchema,
  type EsqueceuSenhaData,
} from "@/lib/validations/auth/esqueceu-senha-schema"

interface EsqueceuSenhaFormProps {
  onSubmit: (
    data: EsqueceuSenhaData,
    setError: UseFormSetError<EsqueceuSenhaData>
  ) => Promise<void>
  className?: string
  fieldErrors?: Record<string, string[]>
}

export function EsqueceuSenhaForm({
  onSubmit,
  className,
  fieldErrors,
}: EsqueceuSenhaFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<EsqueceuSenhaData>({
    resolver: zodResolver(esqueceuSenhaSchema),
  })

  async function handleFormSubmit(data: EsqueceuSenhaData) {
    await onSubmit(data, setError)
  }

  useEffect(() => {
    if (!fieldErrors) return

    Object.entries(fieldErrors).forEach(([field, messages]) => {
      if (field === "business") return

      setError(field as keyof EsqueceuSenhaData, {
        type: "server",
        message: messages[0],
      })
    })
  }, [fieldErrors, setError])

  const businessErrors = fieldErrors?.business ?? []

  return (
    <form
      className={className ?? "flex flex-col gap-6"}
      onSubmit={handleSubmit(handleFormSubmit)}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Esqueceu a senha?</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Informe seu e-mail para receber as instruções de recuperação
          </p>
        </div>

        {businessErrors.length > 0 && (
          <AppAlert
            variant="error"
            subtitle="Ocorreu um erro durante a operação"
            messages={businessErrors}
            className="mb-2"
          />
        )}

        <Field>
          <FieldLabel htmlFor="email">E-mail</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-red-500 text-sm">
              {errors.email.message}
            </p>
          )}
        </Field>

        <Field>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando
              </>
            ) : (
              "Enviar e-mail"
            )}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
