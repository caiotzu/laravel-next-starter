import { z } from "@/lib/zod";

export const usuarioGrupoEmpresaSchemaAlteraStatus = z.object({
  status: z.string().min(1, "O status/situação é obrigatório")
});

export type UsuarioGrupoEmpresaFormDataAlteraStatus = z.infer<typeof usuarioGrupoEmpresaSchemaAlteraStatus>;
