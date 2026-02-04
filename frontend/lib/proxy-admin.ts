import axios, { Method } from "axios";

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

  const response = await axios.post<ProxyResponse<T>>(
    "/api/proxy/admin",
    {
      url,
      method,
      data,
    }
  );

  return response.data.data;
}
