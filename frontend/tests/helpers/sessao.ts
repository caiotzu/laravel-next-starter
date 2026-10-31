import { RedisSessionStore } from "@/lib/session/redis-store";
import type { ContextoSessao } from "@/lib/session/tipos";

import { FakeRedis } from "./fake-redis";

/** Backend de testes: `getSessionStore()` (mockado) devolve `harness.store`. */
export const harness: { store: RedisSessionStore; redis: FakeRedis } = {
  redis: new FakeRedis(),
  store: undefined as unknown as RedisSessionStore,
};

export function reiniciarSessoes() {
  harness.redis = new FakeRedis();
  harness.store = new RedisSessionStore(harness.redis);
}

reiniciarSessoes();

/** Cria uma sessão e devolve o cookie que o navegador teria. */
export async function sessaoDeTeste(contexto: ContextoSessao, token: string, ttl = 3600) {
  const sid = await harness.store.criar({ contexto, token }, ttl);

  return { sid, cookie: `${contexto}_sid` };
}

/** JWT de teste com `exp` (assinatura inválida: o BFF só lê o `exp`). */
export function jwtComExp(expiraEmSegundos: number, extra: Record<string, unknown> = {}) {
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");

  return `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ ...extra, exp: Math.floor(Date.now() / 1000) + expiraEmSegundos })}.assinatura-de-teste`;
}
