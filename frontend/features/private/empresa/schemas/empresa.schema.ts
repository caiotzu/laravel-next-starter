import { z } from "zod";

import { ESTADOS, type UF } from "@/constants/estados";

const UF_VALUES = Object.keys(ESTADOS) as [UF, ...UF[]];

export const empresaSchemaEdicao = z.object({
  matriz_id: z.string().optional(),
  nome_fantasia: z.string().min(1, "O nome fantasia é obrigatório"),
  razao_social: z.string().min(1, "A razao social é obrigatória"),
  inscricao_estadual: z.string().optional(),
  inscricao_municipal: z.string().optional(),
  status: z.string().min(1, "O status/situação é obrigatório").optional(),
  uf: z.enum(UF_VALUES, {
    message: "A UF e obrigatória",
  }),
});

export type EmpresaFormDataEdicao = z.input<typeof empresaSchemaEdicao>;
