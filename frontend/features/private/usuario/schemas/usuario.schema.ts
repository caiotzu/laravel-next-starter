import { z } from "zod";

export const usuarioSchemaCadastro = z.object({
  nome: z.string().min(1, "O nome do usuário é obrigatório"),
  email: z.email("E-mail inválido"),
  grupo_id: z.uuid("Grupo inválido ou não selecionado")
});

export const usuarioSchemaEdicao = z.object({
  nome: z.string().min(1, "O nome do usuário é obrigatório"),
  email: z.email("E-mail inválido"),
  grupo_id: z.uuid("Grupo inválido ou não selecionado"),
  status: z.string().min(1, "O status/situação do usuário é obrigatório").optional()
});

export type UsuarioFormDataCadastro = z.infer<typeof usuarioSchemaCadastro>;
export type UsuarioFormDataEdicao = z.infer<typeof usuarioSchemaEdicao>;
