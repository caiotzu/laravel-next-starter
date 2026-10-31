import Redis from "ioredis";

import { SessaoIndisponivelError } from "./tipos";

type GlobalComRedis = typeof globalThis & { __bffRedis?: Redis; __bffRedisUltimoLog?: number };

const global_ = globalThis as GlobalComRedis;

/**
 * Uma conexão por processo, guardada em `globalThis`: o Next recarrega módulos em desenvolvimento
 * e pode duplicá-los entre bundles (proxy.ts × route handlers); sem isso cada recarga abriria
 * conexões novas.
 *
 * Falha rápido: com o Redis fora do ar a requisição recebe erro em ~2 s em vez de ficar pendurada.
 */
export function obterConexaoRedis(): Redis {
  if (global_.__bffRedis) return global_.__bffRedis;

  const url = process.env.REDIS_URL;

  if (!url) {
    throw new SessaoIndisponivelError("REDIS_URL não configurada.");
  }

  const conexao = new Redis(url, {
    maxRetriesPerRequest: 1,
    connectTimeout: 3000,
    commandTimeout: 2000,
    retryStrategy: (tentativas) => Math.min(tentativas * 200, 2000),
  });

  // Sem este listener, um erro de conexão derruba o processo ("unhandled error event").
  // Registra só o código (a mensagem poderia conter o host), no máximo a cada 10 s.
  conexao.on("error", (erro: NodeJS.ErrnoException) => {
    const agora = Date.now();

    if (agora - (global_.__bffRedisUltimoLog ?? 0) < 10_000) return;

    global_.__bffRedisUltimoLog = agora;
    console.error(`[sessao] Redis indisponível (${erro.code ?? erro.name}).`);
  });

  global_.__bffRedis = conexao;

  return conexao;
}

/** Encerra a conexão (testes e desligamento ordenado). */
export async function fecharConexaoRedis(): Promise<void> {
  const conexao = global_.__bffRedis;

  global_.__bffRedis = undefined;

  if (conexao) await conexao.quit().catch(() => conexao.disconnect());
}
