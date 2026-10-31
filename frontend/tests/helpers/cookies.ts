import { AsyncLocalStorage } from "node:async_hooks";

export interface OpcoesCookie {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: string;
  path?: string;
  maxAge?: number;
}

/**
 * Cookies de UM navegador (um usuário). Imita o que `cookies()` do `next/headers` oferece nos
 * route handlers: `get` e `set` (maxAge 0 apaga).
 */
export class JarDeCookies {
  private readonly valores = new Map<string, string>();
  /** Histórico de gravações, para os testes conferirem atributos. */
  readonly gravacoes: { nome: string; valor: string; opcoes?: OpcoesCookie }[] = [];

  constructor(inicial: Record<string, string> = {}) {
    for (const [nome, valor] of Object.entries(inicial)) this.valores.set(nome, valor);
  }

  get = (nome: string) => {
    const valor = this.valores.get(nome);

    return valor === undefined ? undefined : { name: nome, value: valor };
  };

  set = (nome: string, valor: string, opcoes?: OpcoesCookie) => {
    this.gravacoes.push({ nome, valor, opcoes });

    if (opcoes?.maxAge === 0 || valor === "") this.valores.delete(nome);
    else this.valores.set(nome, valor);
  };

  valor(nome: string) {
    return this.valores.get(nome);
  }

  todos() {
    return Object.fromEntries(this.valores);
  }
}

const armazenamento = new AsyncLocalStorage<JarDeCookies>();
const padrao = new JarDeCookies();

/** Vai no `vi.mock("next/headers")`: devolve o jar da requisição em andamento. */
export const cookiesFalsos = async () => armazenamento.getStore() ?? padrao;

/**
 * Executa `fn` "como" o navegador dono do `jar`. Como o jar é por contexto assíncrono, DUAS
 * chamadas em `Promise.all` com jars diferentes não se misturam: simula dois usuários ao mesmo tempo.
 */
export function comoNavegador<T>(jar: JarDeCookies, fn: () => Promise<T>): Promise<T> {
  return armazenamento.run(jar, fn);
}
