import { gerarSid, sidTemFormatoValido } from "./sid";
import { type ContextoSessao, type DadosSessao, SessaoIndisponivelError, type SessionStore } from "./tipos";

/** Subconjunto do cliente ioredis que o store usa (facilita testar com um duplo). */
export interface ClienteRedis {
  set(chave: string, valor: string, modo: "EX", segundos: number, condicao: "NX"): Promise<"OK" | null>;
  get(chave: string): Promise<string | null>;
  del(chave: string): Promise<number>;
}

export const PREFIXO_CHAVE_SESSAO = "bff:sess:";

const CONTEXTOS: readonly ContextoSessao[] = ["admin", "private"];

function chaveDaSessao(sid: string): string {
  return `${PREFIXO_CHAVE_SESSAO}${sid}`;
}

function agoraEmSegundos(): number {
  return Math.floor(Date.now() / 1000);
}

function ehDadosSessao(valor: unknown): valor is DadosSessao {
  if (valor === null || typeof valor !== "object") return false;

  const v = valor as Record<string, unknown>;

  return (
    CONTEXTOS.includes(v.contexto as ContextoSessao) &&
    typeof v.token === "string" &&
    v.token !== "" &&
    typeof v.criadaEm === "number" &&
    typeof v.expiraEm === "number"
  );
}

/**
 * Sessões no Redis: `bff:sess:<sid>` → JSON, com TTL nativo (`EX`). O TTL do Redis é a expiração
 * "de verdade"; `expiraEm` dentro do valor é uma segunda barreira (relógio/TTL divergentes).
 *
 * Qualquer falha do Redis vira `SessaoIndisponivelError` (sem detalhes), nunca uma sessão válida.
 */
export class RedisSessionStore implements SessionStore {
  constructor(
    private readonly redis: ClienteRedis,
    private readonly agora: () => number = agoraEmSegundos
  ) {}

  async criar(dados: { contexto: ContextoSessao; token: string }, ttlSegundos: number): Promise<string> {
    const ttl = Math.max(1, Math.floor(ttlSegundos));
    const criadaEm = this.agora();
    const valor = JSON.stringify({ ...dados, criadaEm, expiraEm: criadaEm + ttl } satisfies DadosSessao);

    try {
      // NX: nunca sobrescreve uma sessão existente (colisão de 256 bits é impossível na prática,
      // mas a garantia é gratuita). Em colisão, sorteia outro `sid`.
      for (let tentativa = 0; tentativa < 3; tentativa++) {
        const sid = gerarSid();
        const gravou = await this.redis.set(chaveDaSessao(sid), valor, "EX", ttl, "NX");

        if (gravou === "OK") return sid;
      }
    } catch {
      throw new SessaoIndisponivelError();
    }

    throw new SessaoIndisponivelError("Não foi possível gerar um identificador de sessão único.");
  }

  async obter(sid: string): Promise<DadosSessao | null> {
    if (!sidTemFormatoValido(sid)) return null;

    let bruto: string | null;

    try {
      bruto = await this.redis.get(chaveDaSessao(sid));
    } catch {
      throw new SessaoIndisponivelError();
    }

    if (bruto === null) return null;

    let dados: unknown;

    try {
      dados = JSON.parse(bruto);
    } catch {
      await this.destruir(sid);
      return null;
    }

    if (!ehDadosSessao(dados)) {
      await this.destruir(sid);
      return null;
    }

    if (dados.expiraEm <= this.agora()) {
      await this.destruir(sid);
      return null;
    }

    return dados;
  }

  async destruir(sid: string): Promise<void> {
    if (!sidTemFormatoValido(sid)) return;

    try {
      await this.redis.del(chaveDaSessao(sid));
    } catch {
      throw new SessaoIndisponivelError();
    }
  }
}
