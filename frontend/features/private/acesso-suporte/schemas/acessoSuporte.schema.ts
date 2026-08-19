import { z } from "zod";

export const acessoSuporteSchemaConceder = z.object({
  usuario_admin_id: z.string().uuid("Selecione um administrador."),
  duracao_minutos: z
    .number()
    .int()
    .min(5, "O acesso deve durar pelo menos 5 minutos.")
    .max(120, "O acesso não pode durar mais que 120 minutos."),
  motivo: z.string().max(500, "O motivo pode ter no máximo 500 caracteres.").optional(),
});

export type AcessoSuporteFormDataConceder = z.infer<typeof acessoSuporteSchemaConceder>;
