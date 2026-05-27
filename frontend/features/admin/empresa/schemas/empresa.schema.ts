import { z } from "zod";

import {
  EMPRESA_CONTATO_TIPOS,
  type EmpresaContatoTipo,
} from "@/constants/empresa-contato-tipos";
import {
  EMPRESA_ENDERECO_TIPOS,
  type EmpresaEnderecoTipo,
} from "@/constants/empresa-endereco-tipos";
import {
  EMPRESA_STATUS_OPTIONS,
  type EmpresaStatusValue,
} from "@/constants/empresa-status";
import { ESTADOS, type UF } from "@/constants/estados";
import { onlyDigits } from "@/lib/utils";

const UF_VALUES = Object.keys(ESTADOS) as [UF, ...UF[]];
const EMPRESA_ENDERECO_TIPO_VALUES = Object.keys(
  EMPRESA_ENDERECO_TIPOS
) as [EmpresaEnderecoTipo, ...EmpresaEnderecoTipo[]];
const EMPRESA_CONTATO_TIPO_VALUES = Object.keys(
  EMPRESA_CONTATO_TIPOS
) as [EmpresaContatoTipo, ...EmpresaContatoTipo[]];
const EMPRESA_STATUS_VALUES = EMPRESA_STATUS_OPTIONS.map(
  (option) => option.value
) as [EmpresaStatusValue, ...EmpresaStatusValue[]];

export const empresaEnderecoSchema = z.object({
  id: z.string().optional(),
  tipo: z.enum(EMPRESA_ENDERECO_TIPO_VALUES, {
    message: "O tipo do endereco e obrigatorio",
  }),
  municipio_id: z.string().min(1, "O municipio e obrigatorio"),
  principal: z.boolean(),
  ativo: z.boolean(),
  cep: z.string().min(1, "O CEP e obrigatorio").refine((value) => {
    return onlyDigits(value).length === 8;
  }, "O CEP deve conter 8 digitos"),
  logradouro: z.string().min(1, "O logradouro e obrigatorio"),
  numero: z.string().min(1, "O numero e obrigatorio"),
  bairro: z.string().min(1, "O bairro e obrigatorio"),
  complemento: z.string().optional(),
});

export const empresaContatoSchema = z.object({
  id: z.string().optional(),
  tipo: z.enum(EMPRESA_CONTATO_TIPO_VALUES, {
    message: "O tipo do contato e obrigatorio",
  }),
  valor: z.string().min(1, "O valor do contato e obrigatorio"),
  principal: z.boolean(),
  ativo: z.boolean(),
}).superRefine((contato, ctx) => {
  if (contato.tipo === "E") {
    const emailSchema = z.string().email("Informe um e-mail valido");
    const result = emailSchema.safeParse(contato.valor);

    if (!result.success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["valor"],
        message: "Informe um e-mail valido",
      });
    }
  }

  if (contato.tipo === "T") {
    const digits = onlyDigits(contato.valor);

    if (![10, 11].includes(digits.length)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["valor"],
        message: "Informe um telefone valido",
      });
    }
  }
});

export const empresaSchemaCadastro = z.object({
  grupo_empresa_id: z.string().min(1, "O grupo da empresa e obrigatorio"),
  matriz_id: z.string().optional(),
  cnpj: z.string().min(1, "O CNPJ e obrigatorio").refine((value) => {
    return onlyDigits(value).length === 14;
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
});

export const empresaSchemaEdicao = z.object({
  grupo_empresa_id: z.string().optional(),
  matriz_id: z.string().min(1, "A matriz e obrigatoria"),
  cnpj: z.string().min(1, "O CNPJ e obrigatorio").refine((value) => {
    return onlyDigits(value).length === 14;
  }, "O CNPJ deve conter 14 digitos"),
  nome_fantasia: z.string().min(1, "O nome fantasia e obrigatorio"),
  razao_social: z.string().min(1, "A razao social e obrigatoria"),
  inscricao_estadual: z.string().optional(),
  inscricao_municipal: z.string().optional(),
  uf: z.enum(UF_VALUES, {
    message: "A UF e obrigatoria",
  }),
  status: z.enum(EMPRESA_STATUS_VALUES, {
    message: "O status e obrigatorio",
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
      code: z.ZodIssueCode.custom,
      path: ["contatos"],
      message: "Nao pode existir mais de 1 e-mail principal",
    });
  }

  if (telefonePrincipal > 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["contatos"],
      message: "Nao pode existir mais de 1 telefone principal",
    });
  }
});

export type EmpresaFormDataCadastro = z.input<typeof empresaSchemaCadastro>;
export type EmpresaFormDataEdicao = z.input<typeof empresaSchemaEdicao>;
export type EmpresaEnderecoFormData = z.input<typeof empresaEnderecoSchema>;
export type EmpresaContatoFormData = z.input<typeof empresaContatoSchema>;
