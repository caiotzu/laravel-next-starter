import { z } from "zod"

export const loginSchema = z.object({
  email: z
    .email({ message: "E-mail inválido" })
    .min(1, { message: "O e-mail é obrigatório" }),

  password: z
    .string()
    .min(1, { message: "A senha é obrigatória" })
})

export type LoginData = z.infer<typeof loginSchema>
