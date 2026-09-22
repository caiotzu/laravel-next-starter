import { NextResponse } from "next/server";

import axios from "axios";

import { validarOrigem } from "@/lib/utils";

import { ipsEncaminhados } from "@/lib/client-ip";

export async function POST(req: Request) {
  try {
    const erroOrigem = validarOrigem(req);
    if (erroOrigem) return erroOrigem;

    const body = await req.json();

    const response = await axios.post(
      `${process.env.BACKEND_URL}/admin/esqueceu-senha`,
      body,
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": req.headers.get("user-agent") || "",
          "X-Forwarded-For": ipsEncaminhados(req).forwardedFor, // IP validado (lib/client-ip.ts)
          "X-Real-IP": ipsEncaminhados(req).realIp,
        },
        timeout: 10000,
        validateStatus: () => true,
      }
    );

    if (response.status >= 400) {
      return NextResponse.json(response.data, {
        status: response.status,
      });
    }

    return NextResponse.json({
      status: response.status,
      data: response.data,
    });
  } catch {
    return NextResponse.json(
      {
        errors: {
          business: ["Erro inesperado ao enviar o e-mail."],
        },
      },
      { status: 500 }
    );
  }
}
