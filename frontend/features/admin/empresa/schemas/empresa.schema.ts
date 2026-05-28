import { z } from "zod";

import { ESTADOS, type UF } from "@/constants/estados";
import { onlyAlphaNumeric } from "@/lib/utils";

import { empresaContatoSchema } from "../../empresa-contato/schemas/empresa-contato.schema";
import { empresaEnderecoSchema } from "../../empresa-endereco/schemas/empresa-endereco.schema";

const UF_VALUES = Object.keys(ESTADOS) as [UF, ...UF[]];

export const empresaSchemaCadastro = z.object({
  grupo_empresa_id: z.string().min(1, "O grupo da empresa e obrigatório"),
  matriz_id: z.string().optional(),
  cnpj: z.string().min(1, "O CNPJ e obrigatório").refine((value) => {
    return onlyAlphaNumeric(value).length === 14;
  }, "O CNPJ deve conter 14 dígitos"),
  nome_fantasia: z.string().min(1, "O nome fantasia e obrigatório"),
  razao_social: z.string().min(1, "A razao social e obrigatória"),
  inscricao_estadual: z.string().optional(),
  inscricao_municipal: z.string().optional(),
  uf: z.enum(UF_VALUES, {
    message: "A UF e obrigatória",
  }),
  enderecos: z.array(empresaEnderecoSchema).default([]),
  contatos: z.array(empresaContatoSchema).default([]),
});

export const empresaSchemaEdicao = z.object({
  grupo_empresa_id: z.string().optional(),
  matriz_id: z.string().min(1, "A matriz e obrigatoria"),
  cnpj: z.string().min(1, "O CNPJ e obrigatorio").refine((value) => {
    return onlyAlphaNumeric(value).length === 14;
  }, "O CNPJ deve conter 14 digitos"),
  nome_fantasia: z.string().min(1, "O nome fantasia e obrigatorio"),
  razao_social: z.string().min(1, "A razao social e obrigatoria"),
  inscricao_estadual: z.string().optional(),
  inscricao_municipal: z.string().optional(),
  uf: z.enum(UF_VALUES, {
    message: "A UF e obrigatoria",
  }),
  enderecos: z.array(empresaEnderecoSchema).default([]),
  contatos: z.array(empresaContatoSchema).default([]),
}).superRefine((empresa, ctx) => {
  const emailPrincipal = empresa.contatos.filter(
    (contato) => contato.tipo === "E" && contato.principal
  ).length;

  const telefonePrincipal = empresa.contatos.filter(
    (contato) => contato.tipo === "T" && contato.principal
  ).length;

  if (emailPrincipal > 1) {
    ctx.addIssue({
      code: "custom",
      path: ["contatos"],
      message: "Nao pode existir mais de 1 e-mail principal",
    });
  }

  if (telefonePrincipal > 1) {
    ctx.addIssue({
      code: "custom",
      path: ["contatos"],
      message: "Nao pode existir mais de 1 telefone principal",
    });
  }
});

export type EmpresaFormDataCadastro = z.input<typeof empresaSchemaCadastro>;
export type EmpresaFormDataEdicao = z.input<typeof empresaSchemaEdicao>;
