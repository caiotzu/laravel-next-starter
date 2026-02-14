import { z } from "zod";

export const grupoEmpresaSchemaCadastro = z.object({
  nome: z.string().min(1, "O nome do grupo é obrigatório"),
  usuario: z.object({
    nome: z.string().min(1, "O nome do usuário é obrigatório"),
    email: z.string().email("E-mail inválido"),
  }),
});

export const grupoEmpresaSchemaEdicao = z.object({
  nome: z.string().min(1, "O nome do grupo é obrigatório"),
});

export type GrupoEmpresasFormDataCadastro = z.infer<typeof grupoEmpresaSchemaCadastro>;
export type GrupoEmpresasFormDataEdicao = z.infer<typeof grupoEmpresaSchemaEdicao>;
