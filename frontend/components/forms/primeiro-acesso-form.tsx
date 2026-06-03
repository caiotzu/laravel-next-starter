"use client"

import { useEffect, useMemo, useState } from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { Check, Eye, EyeOff, Loader2 } from "lucide-react"
import { useForm, type UseFormSetError } from "react-hook-form"

import { AppAlert } from "@/components/feedback/AppAlert"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"

import {
  primeiroAcessoSchema,
  type PrimeiroAcessoData,
} from "@/lib/validations/auth/primeiro-acesso-schema"
import { getPasswordRequirements } from "@/lib/validations/password"

interface PrimeiroAcessoFormProps {
  onSubmit: (
    data: PrimeiroAcessoData,
    setError: UseFormSetError<PrimeiroAcessoData>
  ) => Promise<void>
  className?: string
  fieldErrors?: Record<string, string[]>
  title?: string
  description?: string
  submitLabel?: string
  loadingLabel?: string
}

export type { PrimeiroAcessoFormProps }

export function PrimeiroAcessoForm({
  className,
  onSubmit,
  fieldErrors,
  title = "Primeiro acesso",
  description = "Defina sua nova senha para acessar a conta",
  submitLabel = "Salvar nova senha",
  loadingLabel = "Salvando",
}: PrimeiroAcessoFormProps) {
  const [showSenha, setShowSenha] = useState(false)
  const [showSenhaConfirmacao, setShowSenhaConfirmacao] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PrimeiroAcessoData>({
    resolver: zodResolver(primeiroAcessoSchema),
  })

  const senha = watch("senha") || ""
  const senhaConfirmacao = watch("senha_confirma") || ""

  const requisitos = useMemo(
    () => getPasswordRequirements(senha),
    [senha]
  )

  const senhaValida = Object.values(requisitos).every(Boolean)
  const senhasConferem = senha.length > 0 && senha === senhaConfirmacao

  async function handleFormSubmit(data: PrimeiroAcessoData) {
    await onSubmit(data, setError)
  }

  useEffect(() => {
    if (!fieldErrors) return

    Object.entries(fieldErrors).forEach(([field, messages]) => {
      if (field === "business") return

      setError(field as keyof PrimeiroAcessoData, {
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
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground text-sm text-balance">
            {description}
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
          <FieldLabel htmlFor="senha">Nova senha</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id="senha"
              type={showSenha ? "text" : "password"}
              placeholder="Digite sua nova senha"
              {...register("senha")}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                type="button"
                aria-label="visualizar senha"
                title="visualizar senha"
                size="icon-xs"
                onClick={() => setShowSenha((prev) => !prev)}
              >
                {showSenha ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>

          {errors.senha && (
            <p className="text-red-500 text-sm">
              {errors.senha.message}
            </p>
          )}

          <div className="mt-3 space-y-1">
            <PasswordRequirement valido={requisitos.length} texto="Mínimo 8 caracteres" />
            <PasswordRequirement valido={requisitos.upper} texto="Letra maiúscula" />
            <PasswordRequirement valido={requisitos.lower} texto="Letra minúscula" />
            <PasswordRequirement valido={requisitos.number} texto="Número" />
            <PasswordRequirement valido={requisitos.special} texto="Caractere especial" />
          </div>
        </Field>

        <Field>
          <FieldLabel htmlFor="senha_confirma">Confirmar senha</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id="senha_confirma"
              type={showSenhaConfirmacao ? "text" : "password"}
              placeholder="Confirme sua nova senha"
              {...register("senha_confirma")}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                type="button"
                aria-label="visualizar confirmação de senha"
                title="visualizar confirmação de senha"
                size="icon-xs"
                onClick={() => setShowSenhaConfirmacao((prev) => !prev)}
              >
                {showSenhaConfirmacao ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          {errors.senha_confirma && (
            <p className="text-red-500 text-sm">
              {errors.senha_confirma.message}
            </p>
          )}
        </Field>

        <Field>
          <Button type="submit" disabled={isSubmitting || !senhaValida || !senhasConferem}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {loadingLabel}
              </>
            ) : (
              submitLabel
            )}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}

function PasswordRequirement({
  valido,
  texto,
}: {
  valido: boolean
  texto: string
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Check className={valido ? "h-4 w-4 text-emerald-600" : "h-4 w-4 text-muted-foreground"} />
      <span className={valido ? "text-emerald-700" : "text-muted-foreground"}>
        {texto}
      </span>
    </div>
  )
}
