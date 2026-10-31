import { randomBytes } from "node:crypto";

/** 32 bytes aleatórios (256 bits) em base64url = 43 caracteres. Impossível de adivinhar. */
export function gerarSid(): string {
  return randomBytes(32).toString("base64url");
}

const FORMATO_SID = /^[A-Za-z0-9_-]{43}$/;

/**
 * Valida o formato ANTES de qualquer consulta ao Redis: o valor vem de um cookie, ou seja, é
 * controlado por quem faz a requisição. Evita montar chaves com lixo e consultas inúteis.
 */
export function sidTemFormatoValido(sid: unknown): sid is string {
  return typeof sid === "string" && FORMATO_SID.test(sid);
}
