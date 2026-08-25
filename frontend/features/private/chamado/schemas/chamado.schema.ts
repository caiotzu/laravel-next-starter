import { z } from "zod";

export const chamadoAberturaSchema = z.object({
  tipo: z.enum(["financeiro", "plataforma", "acesso", "duvida", "documentacao", "operacional", "outros"], {
    message: "Selecione o tipo do chamado",
  }),
  assunto: z
    .string()
    .min(1, "O assunto é obrigatório")
    .max(150, "O assunto deve ter no máximo 150 caracteres"),
  mensagem: z
    .string()
    .min(1, "A descrição é obrigatória")
    .refine((html) => html.replace(/<[^>]*>/g, "").trim().length > 0, {
      message: "A descrição é obrigatória",
    }),
});

export type ChamadoAberturaFormData = z.infer<typeof chamadoAberturaSchema>;
