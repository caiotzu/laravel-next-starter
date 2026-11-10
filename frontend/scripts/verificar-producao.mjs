#!/usr/bin/env node
/**
 * Confere o ambiente de produção do frontend contra o docs/checklist-producao.md.
 *
 *   npm run verificar:producao                 # variáveis + checagens reais (Redis e backend)
 *   npm run verificar:producao -- --sem-rede   # só as variáveis
 *   node --env-file=.env scripts/verificar-producao.mjs   # carregando as variáveis de um arquivo
 *
 * Só LÊ: não grava nada no Redis nem no backend. Sai com código 1 se houver ERRO (avisos não falham).
 * Nunca imprime a senha do Redis nem a URL completa.
 */
import { pathToFileURL } from "node:url";

import Redis from "ioredis";

const ERRO = "erro";
const AVISO = "aviso";

const ehLocal = (host) => ["localhost", "127.0.0.1", "::1", "[::1]", "0.0.0.0"].includes(host);

function lerUrl(valor) {
  try {
    return new URL(valor);
  } catch {
    return null;
  }
}

/**
 * Regras sobre as variáveis de ambiente (sem rede). Função pura: recebe um objeto `env` e devolve
 * `[{ nivel, chave, mensagem }]`.
 */
export function analisarAmbiente(env) {
  const p = [];
  const erro = (chave, mensagem) => p.push({ nivel: ERRO, chave, mensagem });
  const aviso = (chave, mensagem) => p.push({ nivel: AVISO, chave, mensagem });

  if (env.NODE_ENV !== "production") {
    erro("NODE_ENV", `Deve ser "production" (está "${env.NODE_ENV ?? ""}"): é ele que ativa o cookie __Host-, Secure e HSTS.`);
  }

  // BACKEND_URL
  const backend = lerUrl(env.BACKEND_URL ?? "");

  if (!backend) {
    erro("BACKEND_URL", "Ausente ou inválida (ex.: http://api-interna/api).");
  } else {
    if (ehLocal(backend.hostname)) aviso("BACKEND_URL", "Aponta para localhost; em produção use o endereço da rede INTERNA da API.");
    if (!backend.pathname.replace(/\/+$/, "").endsWith("/api")) aviso("BACKEND_URL", 'Normalmente termina em "/api".');
  }

  // FRONTEND_URL
  const frontend = lerUrl(env.FRONTEND_URL ?? "");

  if (!frontend) {
    erro("FRONTEND_URL", "Ausente ou inválida (ex.: https://app.seu-dominio.com.br).");
  } else {
    if (frontend.protocol !== "https:") erro("FRONTEND_URL", "Deve usar https:// em produção.");
    if (ehLocal(frontend.hostname)) erro("FRONTEND_URL", "Aponta para localhost: a validação de origem recusaria os usuários reais.");
    if (frontend.pathname !== "/" || frontend.search || frontend.hash) {
      aviso("FRONTEND_URL", "Deve ser só a origem (esquema + domínio), sem caminho.");
    }
    if ((env.FRONTEND_URL ?? "").endsWith("/")) aviso("FRONTEND_URL", "Remova a barra final.");
  }

  // TRUSTED_PROXY_HOPS
  const saltosBruto = env.TRUSTED_PROXY_HOPS;

  if (saltosBruto === undefined || saltosBruto.trim() === "") {
    aviso("TRUSTED_PROXY_HOPS", "Não definida: o padrão é 1. Confirme que há exatamente 1 proxy reverso entre a internet e o Next.");
  } else if (!/^\d+$/.test(saltosBruto.trim())) {
    erro("TRUSTED_PROXY_HOPS", `Valor inválido "${saltosBruto}": use um número inteiro (ex.: 1).`);
  } else if (Number(saltosBruto) === 0) {
    erro("TRUSTED_PROXY_HOPS", "Com 0 o IP do usuário não é repassado: o backend vê o IP do servidor Next para todos e todos dividem a mesma cota de limite.");
  } else if (Number(saltosBruto) > 3) {
    aviso("TRUSTED_PROXY_HOPS", `${saltosBruto} é incomum. Maior que o real faz o BFF confiar num IP escolhido pelo cliente.`);
  }

  // REDIS_URL
  const redis = lerUrl(env.REDIS_URL ?? "");

  if (!redis) {
    erro("REDIS_URL", "Ausente ou inválida: sem Redis ninguém consegue entrar (503).");
  } else {
    if (redis.protocol !== "rediss:") erro("REDIS_URL", 'Sem TLS: use "rediss://" (com dois "s").');
    if (!redis.password) erro("REDIS_URL", "Sem senha: use rediss://:SENHA@host:6380.");
    if (ehLocal(redis.hostname)) aviso("REDIS_URL", "Aponta para localhost; em produção o Redis fica em rede privada própria.");
  }

  // CSP_MODO
  const modo = (env.CSP_MODO ?? "").trim().toLowerCase();

  if (modo === "report-only") {
    erro("CSP_MODO", '"report-only" NÃO bloqueia nada, só registra. Remova a variável em produção.');
  } else if (modo !== "") {
    aviso("CSP_MODO", `Valor "${env.CSP_MODO}" não é usado; remova a variável.`);
  }

  return p;
}

export function temErro(problemas) {
  return problemas.some((x) => x.nivel === ERRO);
}

function opcoesRedis(url) {
  const u = new URL(url);

  return {
    host: u.hostname.replace(/^\[|\]$/g, ""),
    port: Number(u.port || 6379),
    tls: u.protocol === "rediss:" ? { servername: u.hostname } : undefined,
    connectTimeout: 4000,
    commandTimeout: 3000,
    maxRetriesPerRequest: 0,
    retryStrategy: () => null,
    lazyConnect: true,
    enableOfflineQueue: false,
  };
}

/**
 * Checagens reais no Redis: responde com a senha, RECUSA sem senha, política noeviction e AOF.
 * Só comandos de leitura (PING, CONFIG GET).
 */
export async function verificarRedis(url) {
  const p = [];
  const erro = (chave, mensagem) => p.push({ nivel: ERRO, chave, mensagem });
  const aviso = (chave, mensagem) => p.push({ nivel: AVISO, chave, mensagem });

  const comSenha = new Redis(url, { ...opcoesRedis(url), username: undefined });

  comSenha.on("error", () => {});

  try {
    await comSenha.connect();

    if ((await comSenha.ping()) !== "PONG") erro("REDIS", "PING não respondeu PONG.");

    try {
      const [, politica] = await comSenha.config("GET", "maxmemory-policy");

      if (politica !== "noeviction") {
        erro("REDIS", `maxmemory-policy="${politica}": com política diferente de noeviction o Redis pode descartar sessões em silêncio.`);
      }
    } catch {
      aviso("REDIS", "Não foi possível ler maxmemory-policy (CONFIG bloqueado, comum em Redis gerenciado). Confirme no painel que é noeviction.");
    }

    try {
      const [, aof] = await comSenha.config("GET", "appendonly");

      if (aof !== "yes") aviso("REDIS", "AOF desligado: reiniciar o Redis desloga todos os usuários. Aceitável só se isso for esperado.");
    } catch {
      aviso("REDIS", "Não foi possível ler appendonly (CONFIG bloqueado). Confirme a persistência no painel.");
    }
  } catch (e) {
    erro("REDIS", `Não conectou/autenticou com a REDIS_URL informada (${e?.code ?? e?.name ?? "erro"}). Confira host, porta, senha e TLS.`);

    return p;
  } finally {
    comSenha.disconnect();
  }

  // Sem senha: tem que ser recusado.
  const u = new URL(url);
  // Sem ready check: ele próprio dispara INFO e fecharia a conexão por NOAUTH antes do nosso PING.
  const semSenha = new Redis({ ...opcoesRedis(url), enableReadyCheck: false, username: undefined, password: undefined });

  // O Redis 7 recusa já no handshake (HELLO) e o ioredis só reporta isso no evento "error".
  let ultimoErro = "";

  semSenha.on("error", (e) => {
    ultimoErro = String(e?.message ?? "");
  });

  try {
    await semSenha.connect();
    await semSenha.ping();
    erro("REDIS", `O Redis em ${u.hostname}:${u.port || 6379} aceita comandos SEM senha. Defina requirepass/ACL.`);
  } catch (e) {
    const msg = `${e?.message ?? ""} ${ultimoErro}`;

    if (!/NOAUTH|WRONGPASS|Authentication required/i.test(msg)) {
      aviso("REDIS", "Não consegui confirmar que o Redis recusa conexão sem senha (resposta inesperada). Teste manualmente com redis-cli sem -a.");
    }
  } finally {
    semSenha.disconnect();
  }

  return p;
}

/** O backend responde em /up (health do Laravel)? Só aviso: a API pode estar atrás de outra rede. */
export async function verificarBackend(backendUrl) {
  const u = lerUrl(backendUrl ?? "");

  if (!u) return [];

  try {
    const resposta = await fetch(`${u.origin}/up`, { signal: AbortSignal.timeout(4000) });

    if (!resposta.ok) {
      return [{ nivel: AVISO, chave: "BACKEND_URL", mensagem: `${u.origin}/up respondeu HTTP ${resposta.status}.` }];
    }

    return [];
  } catch {
    return [{ nivel: AVISO, chave: "BACKEND_URL", mensagem: `Não consegui falar com ${u.origin}/up a partir daqui (rede, DNS ou API fora do ar).` }];
  }
}

function imprimir(problemas) {
  for (const x of problemas) {
    console.log(`[${x.nivel.toUpperCase()}] ${x.chave}: ${x.mensagem}`);
  }
}

async function principal() {
  const semRede = process.argv.includes("--sem-rede");
  let problemas = analisarAmbiente(process.env);

  if (!semRede) {
    const url = lerUrl(process.env.REDIS_URL ?? "");

    if (url) problemas = problemas.concat(await verificarRedis(process.env.REDIS_URL));

    problemas = problemas.concat(await verificarBackend(process.env.BACKEND_URL));
  }

  if (problemas.length === 0) {
    console.log("Tudo certo: nenhum problema encontrado.");

    return 0;
  }

  imprimir(problemas);
  console.log("");

  if (temErro(problemas)) {
    console.log("Há erros: corrija antes de publicar.");

    return 1;
  }

  console.log("Só avisos: leia cada um e decida conscientemente.");

  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  principal().then(
    (codigo) => process.exit(codigo),
    (e) => {
      console.error("Falha inesperada:", e?.name ?? e);
      process.exit(2);
    }
  );
}
