import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import axios, { Method } from "axios";

interface ProxyRequestBody<T = unknown> {
  url: string;
  method?: Method;
  data?: T;
  headers?: Record<string, string>;
}

interface NormalizedResponse<T> {
  data: T;
  meta?: unknown;
  links?: unknown;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeLaravelResponse<T>(responseData: unknown): NormalizedResponse<T> {

  if (!responseData) {
    return { data: responseData as T };
  }

  if (!isObject(responseData)) {
    return { data: responseData as T };
  }

  const obj = responseData as Record<string, unknown>;

  const data = obj.data;
  const meta = obj.meta;
  const links = obj.links;

  // PAGINAÇÃO
  if (data !== undefined && meta !== undefined && links !== undefined) {
    return {
      data: data as T,
      meta,
      links,
    };
  }

  // RESOURCE / COLLECTION
  if (data !== undefined) {
    return {
      data: data as T,
    };
  }

  // RAW RESPONSE
  return {
    data: responseData as T,
  };
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body: ProxyRequestBody = await req.json();

    if (!body.url) {
      return NextResponse.json(
        {
          errors: {
            business: ["URL é obrigatória."],
          },
        },
        { status: 400 }
      );
    }

    const { url, method = "GET", data, headers: clientHeaders } = body;

    const cookieStore = await cookies();
    const token = cookieStore.get("admin_access_token")?.value;

    // Pega o user-agent original do navegador
    const userAgent = req.headers.get("user-agent") || "";
    const forwardedFor = req.headers.get("x-forwarded-for") || "";
    const realIp = req.headers.get("x-real-ip") || "";

    const backendResponse = await axios.request({
      url: `${process.env.BACKEND_URL}${url}`,
      method,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": userAgent,
        "X-Forwarded-For": forwardedFor,
        "X-Real-IP": realIp,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(clientHeaders || {}),
      },
      data: ["GET", "HEAD"].includes(method.toUpperCase())
        ? undefined
        : data,
      validateStatus: () => true, // nunca lança erro por status
    });
  
    if (backendResponse.status === 401) {
      // Sucesso → apaga cookie
      cookieStore.set("admin_access_token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/",
        maxAge: 0,
      });

      return NextResponse.json(
        {
          ...backendResponse.data,
          tokenExpired: true,
        },
        { status: 401 }
      );
    }

    // Se for erro (400+), repassa o erro exatamente como veio
    if (backendResponse.status >= 400) {
      return NextResponse.json(
        backendResponse.data,
        { status: backendResponse.status }
      );
    }

    // return NextResponse.json({
    //   status: backendResponse.status,
    //   // data: backendResponse.data.data,
    //   data: backendResponse.data,
    // });

    const normalized = normalizeLaravelResponse(
      backendResponse.data
    );

    return NextResponse.json({
      status: backendResponse.status,
      ...normalized,
    });

  } catch {
    return NextResponse.json(
      {
        errors: {
          business: ["Ocorreu um erro inesperado."],
        },
      },
      { status: 500 }
    );
  }
}

