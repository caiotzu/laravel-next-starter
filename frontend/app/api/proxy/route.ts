import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios, { AxiosError, Method } from "axios";

interface ProxyRequestBody<T = unknown> {
  url: string;
  method?: Method;
  data?: T;
  headers?: Record<string, string>;
}

interface BackendError {
  error: string;
  messages: string[];
  tokenExpired?: boolean;
}

type ApiErrorResponse = {
  error: boolean
  messages: string[]
}

type BackendResponse<T = unknown> = T | BackendError | string;

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body: ProxyRequestBody = await req.json();

    if (!body.url) throw new Error("URL é obrigatória.");

    const { url, method = "GET", data, headers: clientHeaders } = body;

    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    const backendResponse = await axios.request<BackendResponse>({
      url: `${process.env.BACKEND_URL}${url}`,
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(clientHeaders || {}),
      },
      data: ["GET", "HEAD"].includes(method.toUpperCase()) ? undefined : data,
      validateStatus: () => true, // nunca lança erro por status
    });

    if (backendResponse.status === 401) {
      return NextResponse.json(
        {
          error: true,
          tokenExpired: true,
          messages: ["Token expirado ou inválido"],
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      status: backendResponse.status,
      data: backendResponse.data,
    });
  } catch (err: unknown) { 
    const error = err as AxiosError<ApiErrorResponse>
    
    return NextResponse.json(
      { 
        error: true,
        messages: error.response?.data?.messages || ['Credenciais informadas são inválidas']
      }, 
      { 
        status: error.response?.status || 500 
      }
    );
  }
}
