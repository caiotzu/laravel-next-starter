import { z } from "zod"

export const esqueceuSenhaSchema = z.object({
  email: z
    .email({ message: "E-mail inválido" })
    .min(1, { message: "O e-mail é obrigatório" }),
})

export type EsqueceuSenhaData = z.infer<typeof esqueceuSenhaSchema>
