"use client"

import { useEffect, useState } from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
  InputGroupButton,
} from "@/components/ui/input-group"

import { cn } from "@/lib/utils"
import { loginSchema, type LoginData } from "@/lib/validations/auth/login-schema"
interface LoginFormProps {
  onSubmit?: (data: LoginData) => void
  className?: string
  fieldErrors?: Record<string, string[]>
}

export function LoginForm({ className, onSubmit, fieldErrors, ...props }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  })

  async function handleFormSubmit(data: LoginData) {
    await onSubmit?.(data)
  }

  // Injeta erros do backend direto nos campos
  useEffect(() => {
    if (!fieldErrors) return
    Object.entries(fieldErrors).forEach(([field, messages]) => {
      if (field === "business") return
      setError(field as keyof LoginData, {
        type: "server",
        message: messages[0],
      })
    })
  }, [fieldErrors, setError])

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={handleSubmit(handleFormSubmit)}
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Entre na sua conta</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Digite seu e-mail abaixo para entrar na sua conta
          </p>
        </div>

        {/* Email */}
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
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

        {/* Senha com toggle */}
        <Field>
          <FieldLabel htmlFor="senha">Senha</FieldLabel>
          <InputGroup>
            <InputGroupInput
              id="senha"
              type={showPassword ? "text" : "password"}
              {...register("senha")}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                aria-label="visualizar"
                title="visualizar"
                size="icon-xs"
                onClick={() => setShowPassword(prev => !prev)}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          {errors.senha && (
            <p className="text-red-500 text-sm">{errors.senha.message}</p>
          )}
        </Field>

        {/* Botão submit */}
        <Field>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Entrando
              </>
            ) : (
              "Entrar"
            )}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}