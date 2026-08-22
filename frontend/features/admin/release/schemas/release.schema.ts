import { z } from "zod";

export const releaseSchemaCadastro = z.object({
  contexto: z.enum(["admin", "private"], {
    message: "Selecione o contexto da release",
  }),
  titulo: z
    .string()
    .min(1, "O título da release é obrigatório")
    .max(150, "O título deve ter no máximo 150 caracteres"),
  conteudo: z
    .string()
    .min(1, "O conteúdo da release é obrigatório")
    .refine((html) => html.replace(/<[^>]*>/g, "").trim().length > 0, {
      message: "O conteúdo da release é obrigatório",
    }),
  tipo: z.enum(["feature", "improvement", "fix", "change"], {
    message: "Selecione o tipo da release",
  }),
  versao: z
    .string()
    .min(1, "A versão é obrigatória")
    .max(30, "A versão deve ter no máximo 30 caracteres"),
});

export type ReleaseFormData = z.infer<typeof releaseSchemaCadastro>;
