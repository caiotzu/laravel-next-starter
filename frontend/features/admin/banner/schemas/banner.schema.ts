import { z } from "zod";

export const bannerSchema = z
  .object({
    titulo: z
      .string()
      .min(1, "O título do banner é obrigatório")
      .max(120, "O título deve ter no máximo 120 caracteres"),
    conteudo: z.string().optional(),
    inicio_em: z.string().min(1, "A data de início da campanha é obrigatória"),
    fim_em: z.string().optional(),
    direcionamento_tipo: z.enum(["geral", "entidade"], {
      message: "Selecione o direcionamento do banner",
    }),
    entidade_tipo: z.enum(["admin", "private"]).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.direcionamento_tipo === "entidade" && !data.entidade_tipo) {
      ctx.addIssue({
        code: "custom",
        path: ["entidade_tipo"],
        message: "Selecione a entidade de destino",
      });
    }

    if (data.fim_em && data.inicio_em && data.fim_em <= data.inicio_em) {
      ctx.addIssue({
        code: "custom",
        path: ["fim_em"],
        message: "A data de término deve ser posterior à data de início",
      });
    }
  });

export type BannerFormData = z.infer<typeof bannerSchema>;
