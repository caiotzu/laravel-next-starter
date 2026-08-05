import { z } from "zod";

import {
  EMPRESA_ENDERECO_TIPOS,
  type EmpresaEnderecoTipo,
} from "@/constants/empresa-endereco-tipos";
import { onlyDigits } from "@/lib/utils";


const EMPRESA_ENDERECO_TIPO_VALUES = Object.keys(EMPRESA_ENDERECO_TIPOS) as [EmpresaEnderecoTipo, ...EmpresaEnderecoTipo[]];

export const empresaEnderecoSchema = z.object({
  id: z.string().optional(),
  tipo: z.enum(EMPRESA_ENDERECO_TIPO_VALUES, {
    message: "O tipo do endereço e obrigatório",
  }),
  municipio_id: z.string().min(1, "O município e obrigatório"),
  principal: z.boolean(),
  ativo: z.boolean(),
  cep: z.string().min(1, "O CEP e obrigatório").refine((value) => {
    return onlyDigits(value).length === 8;
  }, "O CEP deve conter 8 dígitos"),
  logradouro: z.string().min(1, "O logradouro e obrigatório"),
  numero: z.string().min(1, "O numero e obrigatório"),
  bairro: z.string().min(1, "O bairro e obrigatório"),
  complemento: z.string().optional(),
});

export type EmpresaEnderecoFormData = z.input<typeof empresaEnderecoSchema>;