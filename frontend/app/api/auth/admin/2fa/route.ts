import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import axios from "axios";

export async function POST(req: Request) {
  try {
    console.log('chegou no proxy')
    const body = await req.json();

    // Captura headers originais do navegador
    const userAgent = req.headers.get("user-agent") || "";
    const forwardedFor = req.headers.get("x-forwarded-for") || "";
    const realIp = req.headers.get("x-real-ip") || "";

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

    const data = response.data;

    // Se backend retornar erro, apenas repassa
    if (response.status >= 400) {
      return NextResponse.json(data, {
        status: response.status,
      });
    }

    // 🔐 Se sucesso, backend deve retornar token
    if (!data?.token) {
      return NextResponse.json(
        {
          errors: {
            business: ["Token não retornado após validação do 2FA."],
          },
        },
        { status: 500 }
      );
    }

    const cookieStore = await cookies();

    cookieStore.set("admin_access_token", data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
      maxAge: 60 * 60, // 1 hora
    });

    return NextResponse.json({
      status: response.status,
      data: data,
    });

  } catch {
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