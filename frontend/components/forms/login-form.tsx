"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldGroup,
  FieldLabel
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

import { cn } from "@/lib/utils"
import { loginSchema, type LoginData } from "@/lib/validations/auth/login-schema"

interface LoginFormProps {
  onSubmit?: (data: LoginData) => void
  className?: string
}

export function LoginForm({ className, onSubmit, ...props }: LoginFormProps) {

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  })

  async function handleFormSubmit(data: LoginData) {
    await onSubmit?.(data)
  }
  
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
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input 
            id="email" 
            type="email" 
            placeholder="m@example.com" 
            required 
            {...register("email")}
          />
          {errors.email && (<p className="text-red-500 text-sm">{errors.email.message}</p>)}
        </Field>
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Senha</FieldLabel>
            <a
              href="#"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Esqueceu sua senha?
            </a>
          </div>
          <Input 
            id="password" 
            type="password" 
            required 
            {...register("password")}
          />
          {errors.password && (<p className="text-red-500 text-sm">{errors.password.message}</p>)}
        </Field>
        <Field>
          <Button 
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
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
