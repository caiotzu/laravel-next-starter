import { z } from "zod"

import { createStrongPasswordSchema } from "../password"

export const redefinirSenhaSchema = z.object({
  senha: createStrongPasswordSchema("A senha"),

  senha_confirma: z
    .string()
    .min(1, { message: "A confirmação da senha é obrigatória" }),
}).refine((data) => data.senha === data.senha_confirma, {
  message: "As senhas não conferem",
  path: ["senha_confirma"],
})

export type RedefinirSenhaData = z.infer<typeof redefinirSenhaSchema>
