import { z } from "zod"

export interface PasswordRequirements {
  length: boolean
  upper: boolean
  lower: boolean
  number: boolean
  special: boolean
}

export function getPasswordRequirements(password: string): PasswordRequirements {
  return {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  }
}

export function createStrongPasswordSchema(
  fieldLabel: string
) {
  return z
    .string()
    .min(8, `${fieldLabel} deve ter no mínimo 8 caracteres.`)
    .regex(/[A-Z]/, `${fieldLabel} deve conter pelo menos uma letra maiúscula.`)
    .regex(/[a-z]/, `${fieldLabel} deve conter pelo menos uma letra minúscula.`)
    .regex(/[0-9]/, `${fieldLabel} deve conter pelo menos um número.`)
    .regex(/[^A-Za-z0-9]/, `${fieldLabel} deve conter pelo menos um caractere especial.`)
}
