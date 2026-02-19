import { z } from "zod";

export const usuarioPerfilSchema = z.object({
  nome: z
    .string()
    .min(3, "O nome deve ter no mínimo 3 caracteres")
    .max(150, "O nome deve ter no máximo 150 caracteres"),

  email: z
    .email("Informe um e-mail válido")
    .max(150, "O e-mail deve ter no máximo 150 caracteres"),
});

export const atualizarSenhaSchema = z.object({
  senha_atual: z
    .string()
    .min(1, "Informe sua senha atual."),

  senha_nova: z
    .string()
    .min(8, "A nova senha deve ter no mínimo 8 caracteres.")
    .regex(/[A-Z]/, "A nova senha deve conter pelo menos uma letra maiúscula.")
    .regex(/[a-z]/, "A nova senha deve conter pelo menos uma letra minúscula.")
    .regex(/[0-9]/, "A nova senha deve conter pelo menos um número.")
    .regex(
      /[^A-Za-z0-9]/,
      "A nova senha deve conter pelo menos um caractere especial."
    ),

  senha_nova_confirma: z
    .string()
    .min(1, "Confirme a nova senha."),
}).refine((data) => data.senha_nova === data.senha_nova_confirma, {
  path: ["senha_nova_confirma"],
  message: "As senhas não conferem.",
});

export type UsuarioPerfilFormData = z.infer<typeof usuarioPerfilSchema>;
export type AtualizarSenhaFormData = z.infer<typeof atualizarSenhaSchema>;