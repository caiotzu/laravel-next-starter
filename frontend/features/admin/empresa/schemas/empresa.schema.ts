import { z } from "zod";

import { ESTADOS, type UF } from "@/constants/estados";
import { onlyAlphaNumeric } from "@/lib/utils";

const UF_VALUES = Object.keys(ESTADOS) as [UF, ...UF[]];

export const empresaSchemaCadastro = z.object({
  grupo_empresa_id: z.string().min(1, "O grupo da empresa é obrigatório"),
  matriz_id: z.string().optional(),
  cnpj: z.string().min(1, "O CNPJ é obrigatório").refine((value) => {
    return onlyAlphaNumeric(value).length === 14;
  }, "O CNPJ deve conter 14 dígitos"),
  nome_fantasia: z.string().min(1, "O nome fantasia é obrigatório"),
  razao_social: z.string().min(1, "A razao social é obrigatória"),
  inscricao_estadual: z.string().optional(),
  inscricao_municipal: z.string().optional(),
  uf: z.enum(UF_VALUES, {
    message: "A UF é obrigatória",
  })
});

export const empresaSchemaEdicao = z.object({
  grupo_empresa_id: z.string().optional(),
  matriz_id: z.string().optional(),
  cnpj: z.string().min(1, "O CNPJ é obrigatorio").refine((value) => {
    return onlyAlphaNumeric(value).length === 14;
  }, "O CNPJ deve conter 14 digitos"),
  nome_fantasia: z.string().min(1, "O nome fantasia é obrigatório"),
  razao_social: z.string().min(1, "A razao social é obrigatória"),
  inscricao_estadual: z.string().optional(),
  inscricao_municipal: z.string().optional(),
  status: z.string().min(1, "O status/situação é obrigatório").optional(),
  uf: z.enum(UF_VALUES, {
    message: "A UF e obrigatória",
  })
});

export type EmpresaFormDataCadastro = z.input<typeof empresaSchemaCadastro>;
export type EmpresaFormDataEdicao = z.input<typeof empresaSchemaEdicao>;
