import { obterConexaoRedis } from "./conexao";

/**
 * Verifica se o Redis das sessões responde (PING). Usado por `GET /api/health`.
 *
 * Devolve só verdadeiro/falso: nunca expõe a mensagem do driver, o host nem a URL de conexão.
 * O PING herda os limites da conexão (`commandTimeout` de 2 s), então não fica pendurado.
 */
export async function redisEstaSaudavel(): Promise<boolean> {
  try {
    return (await obterConexaoRedis().ping()) === "PONG";
  } catch {
    return false;
  }
}
