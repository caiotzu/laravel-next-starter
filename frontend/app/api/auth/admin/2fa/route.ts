import { NextResponse } from "next/server";

import axios from "axios";

import { separarTokenDeSessao } from "@/lib/auth-response";
import { ipsEncaminhados } from "@/lib/client-ip";
import {
  SessaoIndisponivelError,
  iniciarSessao,
  respostaSessaoIndisponivel,
} from "@/lib/session/sessao";
import { validarOrigem } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const erroOrigem = validarOrigem(req);
    if (erroOrigem) return erroOrigem;

    const body = await req.json();

    // Captura headers originais do navegador
    const userAgent = req.headers.get("user-agent") || "";
    const { forwardedFor, realIp } = ipsEncaminhados(req); // IP validado (lib/client-ip.ts)

    const response = await axios.post(
      `${process.env.BACKEND_URL}/admin/2fa/verificar`,
      body,
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": userAgent,
          "X-Forwarded-For": forwardedFor,
          "X-Real-IP": realIp,
        },
        timeout: 10000,
        validateStatus: () => true,
      }
    );

    // Se for erro (400+), repassa o erro exatamente como veio
    if (response.status >= 400) {
      return NextResponse.json(response.data, {
        status: response.status,
      });
    }

    // O JWT fica SÓ no servidor (Redis): o navegador recebe os demais campos e um cookie de
    // sessão opaco, nunca o token (SEC-009).
    const { token, dadosPublicos } = separarTokenDeSessao(response.data.data);

    if (!token) {
      return NextResponse.json(
        {
          errors: {
            business: ["Token não retornado após validação do 2FA."],
          },
        },
        { status: 500 }
      );
    }

    await iniciarSessao("admin", token);

    return NextResponse.json({
      status: response.status,
      data: dadosPublicos,
    });

  } catch (erro) {
    if (erro instanceof SessaoIndisponivelError) return respostaSessaoIndisponivel();

    return NextResponse.json(
      {
        errors: {
          business: ["Erro inesperado ao validar 2FA."],
        },
      },
      { status: 500 }
    );
  }
}
