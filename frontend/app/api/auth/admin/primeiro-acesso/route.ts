import { NextResponse } from "next/server";

import axios from "axios";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const response = await axios.post(
      `${process.env.BACKEND_URL}/admin/primeiro-acesso`,
      body,
      {
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
          business: ["Erro inesperado ao concluir o primeiro acesso."],
        },
      },
      { status: 500 }
    );
  }
}
