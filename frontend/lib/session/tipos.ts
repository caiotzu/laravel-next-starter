/**
 * Sessão do BFF (SEC-009).
 *
 * O JWT de acesso à API Laravel NUNCA vai para o navegador: ele fica no servidor (Redis), associado
 * a um identificador de sessão aleatório e opaco (`sid`). O navegador só guarda o cookie com o `sid`.
 *
 * Cada login cria um `sid` NOVO e independente. Por isso vários usuários (ou o mesmo usuário em
 * vários computadores) usam a plataforma ao mesmo tempo, cada um com a sua sessão e o seu token.
 */
export type ContextoSessao = "admin" | "private";

export interface DadosSessao {
  contexto: ContextoSessao;
  /** JWT de acesso à API. Só existe no servidor. */
  token: string;
  /** Epoch em segundos. */
  criadaEm: number;
  /** Epoch em segundos. Depois disso a sessão não vale mais, mesmo que a chave ainda exista. */
  expiraEm: number;
}

export interface SessionStore {
  /** Cria uma sessão nova e devolve o `sid`. `ttlSegundos` é o tempo de vida (expiração absoluta). */
  criar(dados: { contexto: ContextoSessao; token: string }, ttlSegundos: number): Promise<string>;
  /** Devolve a sessão ou `null` se não existir, tiver expirado ou o `sid` for malformado. */
  obter(sid: string): Promise<DadosSessao | null>;
  /** Remove a sessão (idempotente). */
  destruir(sid: string): Promise<void>;
}

/**
 * O armazenamento de sessões está fora do ar ou mal configurado. É diferente de "sessão inválida":
 * o chamador deve responder 503 (e não 401), para o usuário não achar que a senha estava errada.
 * A mensagem NUNCA contém token, `sid` ou URL de conexão.
 */
export class SessaoIndisponivelError extends Error {
  constructor(mensagem = "Armazenamento de sessões indisponível.") {
    super(mensagem);
    this.name = "SessaoIndisponivelError";
  }
}
