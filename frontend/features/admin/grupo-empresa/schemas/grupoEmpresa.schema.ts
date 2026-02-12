import { z } from "zod";

export const grupoEmpresaSchema = z.object({
  nome: z
    .string()
    .min(3, "O nome do grupo deve ter no mínimo 3 caracteres")
    .max(100, "O nome do grupo deve ter no máximo 255 caracteres"),
});

export type GrupoEmpresasFormData = z.infer<typeof grupoEmpresaSchema>;
