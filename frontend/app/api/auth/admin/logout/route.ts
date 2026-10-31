import { NextResponse } from "next/server";

import axios from "axios";

import { ipsEncaminhados } from "@/lib/client-ip";
import {
  SessaoIndisponivelError,
  encerrarSessao,
  obterTokenDaSessao,
} from "@/lib/session/sessao";
import { validarOrigem } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const erroOrigem = validarOrigem(req);
    if (erroOrigem) return erroOrigem;

    // Token só do servidor. Sem Redis não há como revogá-lo no backend, mas o logout continua:
    // a sessão local é encerrada e o cookie apagado de qualquer forma.
    let token: string | null = null;

    try {
      token = await obterTokenDaSessao("admin");
    } catch (erro) {
      if (!(erro instanceof SessaoIndisponivelError)) throw erro;
    }

    let data: unknown = null;

    if (token) {
      // Pega o user-agent original do navegador
      const userAgent = req.headers.get("user-agent") || "";
      const { forwardedFor, realIp } = ipsEncaminhados(req); // IP validado (lib/client-ip.ts)

      // Revoga o token no backend (melhor esforço): falha de rede ou 4xx/5xx NÃO impede o logout.
      const response = await axios
        .post(
          `${process.env.BACKEND_URL}/admin/logout`,
          {},
          {
            headers: {
              "Content-Type": "application/json",
              "User-Agent": userAgent,
              "X-Forwarded-For": forwardedFor,
              "X-Real-IP": realIp,
              Authorization: `Bearer ${token}`,
            },
            timeout: 10000,
            validateStatus: () => true, // nunca lança erro por status
          }
        )
        .catch(() => null);

      data = response && response.status < 400 ? (response.data?.data ?? null) : null;
    }

    // Sempre: destrói a sessão no servidor e apaga o cookie.
    await encerrarSessao("admin");

    return NextResponse.json({
      status: 200,
      data,
    });

  } catch {
    return NextResponse.json(
      {
        errors: {
          business: ["Erro inesperado ao encerrar a sessão."],
        },
      },
      { status: 500 }
    );
  }
}
