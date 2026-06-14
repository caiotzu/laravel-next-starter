import { z } from "zod";

export const grupoSchemaCadastro = z.object({
  descricao: z.string().min(1, "a descrição do grupo é obrigatório"),
});

export const grupoSchemaEdicao = z.object({
  descricao: z.string().min(1, "a descrição do grupo é obrigatório"),
});

export type GrupoFormDataCadastro = z.infer<typeof grupoSchemaCadastro>;
export type GrupoFormDataEdicao = z.infer<typeof grupoSchemaEdicao>;
