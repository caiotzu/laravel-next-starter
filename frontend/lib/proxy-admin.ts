import axios, { AxiosError, Method } from "axios";

import { ApiErrorResponse } from "@/types/errors";

interface ProxyPayload {
  url: string;
  method?: Method;
  data?: unknown;
}

interface ProxyResponse<T> {
  status: number;
  data: T;
}

export async function proxyAdminRequest<T>({
  url,
  method = "GET",
  data,
}: ProxyPayload): Promise<T> {
  try {
    const response = await axios.post<ProxyResponse<T>>(
      "/api/proxy/admin",
      { url, method, data }
    );

    return response.data.data;
  } catch (err) {
    const error = err as AxiosError<ApiErrorResponse>;

    if (error.response?.status === 401) {
      window.location.href = "/admin";
      return Promise.reject(error);
    }

    throw error;
  }
}