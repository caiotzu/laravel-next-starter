import type { ClienteRedis } from "@/lib/session/redis-store";

/**
 * Redis falso em memória com TTL (`EX`) e `NX`, para testar o `RedisSessionStore` REAL sem rede.
 * `indisponivel = true` simula o Redis fora do ar (todo comando rejeita).
 */
export class FakeRedis implements ClienteRedis {
  readonly dados = new Map<string, { valor: string; expiraEmMs: number }>();
  indisponivel = false;
  comandos = 0;

  private checar() {
    this.comandos++;

    if (this.indisponivel) throw new Error("ECONNREFUSED 10.0.0.1:6379 (senha=segredo)");
  }

  private vivo(chave: string) {
    const item = this.dados.get(chave);

    if (item && item.expiraEmMs <= Date.now()) {
      this.dados.delete(chave);
      return undefined;
    }

    return item;
  }

  async set(chave: string, valor: string, _modo: "EX", segundos: number, _condicao: "NX") {
    this.checar();

    if (this.vivo(chave)) return null;

    this.dados.set(chave, { valor, expiraEmMs: Date.now() + segundos * 1000 });

    return "OK" as const;
  }

  async get(chave: string) {
    this.checar();

    return this.vivo(chave)?.valor ?? null;
  }

  async del(chave: string) {
    this.checar();

    return this.dados.delete(chave) ? 1 : 0;
  }

  /** Quantas sessões existem no momento. */
  total() {
    return [...this.dados.keys()].filter((c) => this.vivo(c)).length;
  }
}
