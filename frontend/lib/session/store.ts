import { obterConexaoRedis } from "./conexao";
import { RedisSessionStore } from "./redis-store";
import type { SessionStore } from "./tipos";

type GlobalComStore = typeof globalThis & { __bffSessionStore?: SessionStore };

const global_ = globalThis as GlobalComStore;

/**
 * Único ponto que decide onde as sessões moram (hoje: Redis). Os testes substituem este módulo
 * por um store em memória (`vi.mock("@/lib/session/store")`).
 */
export function getSessionStore(): SessionStore {
  if (!global_.__bffSessionStore) {
    global_.__bffSessionStore = new RedisSessionStore(obterConexaoRedis());
  }

  return global_.__bffSessionStore;
}
