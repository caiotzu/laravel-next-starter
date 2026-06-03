import { NextResponse } from "next/server";

import axios from "axios";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        {
          errors: {
            business: ["Token é obrigatório."],
          },
        },
        { status: 400 }
      );
    }

    const response = await axios.get(
      `${process.env.BACKEND_URL}/admin/primeiro-acesso/validar`,
      {
        params: { token },
        headers: {
          "Content-Type": "application/json",
          "User-Agent": req.headers.get("user-agent") || "",
          "X-Forwarded-For": req.headers.get("x-forwarded-for") || "",
          "X-Real-IP": req.headers.get("x-real-ip") || "",
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
          business: ["Erro inesperado ao validar o primeiro acesso."],
        },
      },
      { status: 500 }
    );
  }
}
