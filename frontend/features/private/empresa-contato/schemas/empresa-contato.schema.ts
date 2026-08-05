import { z } from "zod";

import {
  EMPRESA_CONTATO_TIPOS,
  type EmpresaContatoTipo,
} from "@/constants/empresa-contato-tipos";
import { onlyDigits } from "@/lib/utils";


const EMPRESA_CONTATO_TIPO_VALUES = Object.keys(EMPRESA_CONTATO_TIPOS) as [EmpresaContatoTipo, ...EmpresaContatoTipo[]];

export const empresaContatoSchema = z.object({
  id: z.string().optional(),
  tipo: z.enum(EMPRESA_CONTATO_TIPO_VALUES, {
    message: "O tipo do contato e obrigatório",
  }),
  valor: z.string().min(1, "O valor do contato e obrigatório"),
  principal: z.boolean(),
  ativo: z.boolean(),
}).superRefine((contato, ctx) => {
  if (contato.tipo === "E") {
    const emailSchema = z.email("Informe um e-mail valido");
    const result = emailSchema.safeParse(contato.valor);

    if (!result.success) {
      ctx.addIssue({
        code: "custom",
        path: ["valor"],
        message: "Informe um e-mail valido",
      });
    }
  }

  if (contato.tipo === "T") {
    const digits = onlyDigits(contato.valor);

    if (![10, 11].includes(digits.length)) {
      ctx.addIssue({
        code: "custom",
        path: ["valor"],
        message: "Informe um telefone valido",
      });
    }
  }
});

export type EmpresaContatoFormData = z.input<typeof empresaContatoSchema>;