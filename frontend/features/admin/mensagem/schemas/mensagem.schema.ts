import { z } from "zod";

export const mensagemSchemaCadastro = z
  .object({
    titulo: z
      .string()
      .min(1, "O título da mensagem é obrigatório")
      .max(120, "O título deve ter no máximo 120 caracteres"),
    conteudo: z.string().min(1, "O conteúdo da mensagem é obrigatório"),
    direcionamento_tipo: z.enum(["grupo_empresa", "usuario"], {
      message: "Selecione o direcionamento da mensagem",
    }),
    grupo_empresa_id: z.string().optional(),
    usuario_id: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.direcionamento_tipo === "grupo_empresa" && !data.grupo_empresa_id) {
      ctx.addIssue({
        code: "custom",
        path: ["grupo_empresa_id"],
        message: "Selecione o grupo de empresa de destino",
      });
    }

    if (data.direcionamento_tipo === "usuario" && !data.usuario_id) {
      ctx.addIssue({
        code: "custom",
        path: ["usuario_id"],
        message: "Selecione o usuário de destino",
      });
    }
  });

export type MensagemFormDataCadastro = z.infer<typeof mensagemSchemaCadastro>;
