import { z } from "zod";

export const usuarioSchema = z.object({
  nome: z.string().min(1, "O nome do usuário é obrigatório"),
  email: z.email("E-mail inválido"),
  grupo_id: z.uuid("Grupo inválido ou não selecionado")
});

export type UsuarioFormData = z.infer<typeof usuarioSchema>;
