import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import axios from "axios";

import { separarTokenDeSessao } from "@/lib/auth-response";
import { ipsEncaminhados } from "@/lib/client-ip";
import {
  SessaoIndisponivelError,
  iniciarSessao,
  obterTokenDaSessao,
  respostaSessaoExpirada,
  respostaSessaoIndisponivel,
} from "@/lib/session/sessao";
import type { ContextoSessao } from "@/lib/session/tipos";
import {
  PROVEDOR_REGEX,
  caminhoBackendPerfilSocial,
  caminhoBackendSocial,
  codigoErroPorStatus,
  gerarBinding,
  nomeCookieSocial,
  nomeCookieVinculo,
  opcoesCookieSocial,
  resultadoVinculoPorStatus,
  urlAposLogin,
  urlAutorizacaoValida,
  urlLoginComErro,
  urlPerfilComVinculo,
  urlSegundoFator,
} from "@/lib/social/social";
import { validarOrigem } from "@/lib/utils";

/**
 * Handlers do login social, compartilhados por Admin e Private (as rotas em
 * `app/api/auth/{admin,private}/social/**` só repassam o contexto e o provedor).
 */

const TIMEOUT_MS = 10000;

function erroJson(mensagem: string, status: number) {
  return NextResponse.json({ errors: { business: [mensagem] } }, { status });
}

/** GET — provedores ativos, para a tela de login montar os botões. Falha = lista vazia. */
export async function listarProvedoresSociais(contexto: ContextoSessao) {
  try {
    const resposta = await axios.get(
      `${process.env.BACKEND_URL}${caminhoBackendSocial(contexto, "provedores")}`,
      { timeout: TIMEOUT_MS, validateStatus: () => true }
    );

    const lista: unknown = resposta.status === 200 ? resposta.data?.data?.provedores : [];

    const provedores = (Array.isArray(lista) ? lista : [])
      .filter((p): p is { chave: string; nome: string } =>
        typeof p?.chave === "string" && PROVEDOR_REGEX.test(p.chave) && typeof p?.nome === "string")
      .map(({ chave, nome }) => ({ chave, nome }));

    return NextResponse.json({ data: { provedores } });
  } catch {
    return NextResponse.json({ data: { provedores: [] } });
  }
}

/** POST — pede ao backend a URL do provedor e grava o binding no navegador. */
export async function iniciarLoginSocial(req: Request, contexto: ContextoSessao, provedor: string) {
  try {
    const erroOrigem = validarOrigem(req);
    if (erroOrigem) return erroOrigem;

    if (!PROVEDOR_REGEX.test(provedor)) return erroJson("Provedor de login não disponível.", 404);

    const binding = gerarBinding();

    const resposta = await axios.post(
      `${process.env.BACKEND_URL}${caminhoBackendSocial(contexto, `${provedor}/iniciar`)}`,
      { binding },
      {
        headers: { "Content-Type": "application/json" },
        timeout: TIMEOUT_MS,
        validateStatus: () => true,
      }
    );

    if (resposta.status >= 400) return NextResponse.json(resposta.data, { status: resposta.status });

    const url: unknown = resposta.data?.data?.url;

    if (!urlAutorizacaoValida(url)) return erroJson("Erro inesperado ao iniciar o login.", 500);

    // Só depois de o backend aceitar: nada é gravado no navegador em caso de erro.
    const cookieStore = await cookies();

    cookieStore.set(nomeCookieSocial(contexto), binding, opcoesCookieSocial());
    // Um fluxo por vez: um vínculo abandonado não pode "sequestrar" o retorno deste login.
    cookieStore.set(nomeCookieVinculo(contexto), "", opcoesCookieSocial(0));

    return NextResponse.json({ data: { url } });
  } catch {
    return erroJson("Erro inesperado ao iniciar o login.", 500);
  }
}

/** Cabeçalhos repassados ao backend nas chamadas feitas com a sessão do usuário. */
function cabecalhosAutenticados(req: Request, token: string) {
  const { forwardedFor, realIp } = ipsEncaminhados(req);

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    "User-Agent": req.headers.get("user-agent") || "",
    "X-Forwarded-For": forwardedFor,
    "X-Real-IP": realIp,
  };
}

/**
 * POST — perfil → vincular. Precisa de sessão (o JWT vem do Redis, nunca do navegador) e da senha
 * atual, que o backend confere. Grava o binding do VÍNCULO e devolve só a URL do provedor.
 */
export async function iniciarVinculoSocial(req: Request, contexto: ContextoSessao, provedor: string) {
  try {
    const erroOrigem = validarOrigem(req);
    if (erroOrigem) return erroOrigem;

    if (!PROVEDOR_REGEX.test(provedor)) return erroJson("Provedor de login não disponível.", 404);

    const token = await obterTokenDaSessao(contexto);
    if (!token) return respostaSessaoExpirada();

    const corpo: unknown = await req.json().catch(() => null);
    const senha = (corpo as { senha?: unknown } | null)?.senha;

    if (typeof senha !== "string" || senha === "") return erroJson("A senha é obrigatória.", 422);

    const binding = gerarBinding();

    const resposta = await axios.post(
      `${process.env.BACKEND_URL}${caminhoBackendPerfilSocial(contexto, `${provedor}/vincular/iniciar`)}`,
      { senha, binding },
      { headers: cabecalhosAutenticados(req, token), timeout: TIMEOUT_MS, validateStatus: () => true }
    );

    if (resposta.status >= 400) return NextResponse.json(resposta.data, { status: resposta.status });

    const url: unknown = resposta.data?.data?.url;

    if (!urlAutorizacaoValida(url)) return erroJson("Erro inesperado ao iniciar o vínculo.", 500);

    const cookieStore = await cookies();

    cookieStore.set(nomeCookieVinculo(contexto), binding, opcoesCookieSocial());
    cookieStore.set(nomeCookieSocial(contexto), "", opcoesCookieSocial(0));

    return NextResponse.json({ data: { url } });
  } catch (e) {
    if (e instanceof SessaoIndisponivelError) return respostaSessaoIndisponivel();

    return erroJson("Erro inesperado ao iniciar o vínculo.", 500);
  }
}

/** Retorno do provedor num VÍNCULO: associa a conta ao usuário da sessão e volta ao perfil. */
async function concluirVinculoSocial(
  req: Request,
  contexto: ContextoSessao,
  provedor: string,
  binding: string,
  params: URLSearchParams
) {
  const volta = (resultado: Parameters<typeof urlPerfilComVinculo>[2]) =>
    NextResponse.redirect(urlPerfilComVinculo(req, contexto, resultado), 303);

  const codigo = params.get("code");
  const state = params.get("state");

  if (params.get("error")) return volta(params.get("error") === "access_denied" ? "cancelado" : "invalido");

  if (!PROVEDOR_REGEX.test(provedor) || !codigo || !state) return volta("invalido");

  try {
    const token = await obterTokenDaSessao(contexto);

    // Sessão expirada no meio do caminho: volta ao login, não ao perfil.
    if (!token) return NextResponse.redirect(urlLoginComErro(req, contexto, "expirado"), 303);

    const resposta = await axios.post(
      `${process.env.BACKEND_URL}${caminhoBackendPerfilSocial(contexto, `${provedor}/vincular/callback`)}`,
      { codigo, state, binding },
      { headers: cabecalhosAutenticados(req, token), timeout: TIMEOUT_MS, validateStatus: () => true }
    );

    if (resposta.status === 401) return NextResponse.redirect(urlLoginComErro(req, contexto, "expirado"), 303);
    if (resposta.status >= 400) return volta(resultadoVinculoPorStatus(resposta.status));

    return volta("ok");
  } catch (e) {
    if (e instanceof SessaoIndisponivelError) return respostaSessaoIndisponivel();

    return volta("indisponivel");
  }
}

/**
 * GET — retorno do provedor (navegação cross-site). Não há `validarOrigem` aqui: a proteção é o
 * par state + binding, conferido pelo backend. Qualquer resultado é um REDIRECT para o frontend
 * (a pessoa está no meio de uma navegação, não numa chamada de API).
 */
export async function concluirLoginSocial(req: Request, contexto: ContextoSessao, provedor: string) {
  const erro = (codigo: Parameters<typeof urlLoginComErro>[2]) =>
    NextResponse.redirect(urlLoginComErro(req, contexto, codigo), 303);

  const cookieStore = await cookies();
  const nomeBinding = nomeCookieSocial(contexto);
  const binding = cookieStore.get(nomeBinding)?.value;

  // Vínculo (perfil): o outro cookie diz qual fluxo foi iniciado neste navegador.
  const nomeVinculo = nomeCookieVinculo(contexto);
  const bindingVinculo = cookieStore.get(nomeVinculo)?.value;

  // Uso único: o binding some do navegador mesmo se o fluxo falhar.
  if (binding !== undefined) cookieStore.set(nomeBinding, "", opcoesCookieSocial(0));
  if (bindingVinculo !== undefined) cookieStore.set(nomeVinculo, "", opcoesCookieSocial(0));

  const params = new URL(req.url).searchParams;

  if (bindingVinculo !== undefined) {
    return concluirVinculoSocial(req, contexto, provedor, bindingVinculo, params);
  }
  const codigo = params.get("code");
  const state = params.get("state");

  if (params.get("error")) {
    return erro(params.get("error") === "access_denied" ? "cancelado" : "negado");
  }

  if (!PROVEDOR_REGEX.test(provedor) || !codigo || !state || !binding) return erro("expirado");

  try {
    const userAgent = req.headers.get("user-agent") || "";
    const { forwardedFor, realIp } = ipsEncaminhados(req);

    const resposta = await axios.post(
      `${process.env.BACKEND_URL}${caminhoBackendSocial(contexto, `${provedor}/callback`)}`,
      { codigo, state, binding },
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": userAgent,
          "X-Forwarded-For": forwardedFor,
          "X-Real-IP": realIp,
        },
        timeout: TIMEOUT_MS,
        validateStatus: () => true,
      }
    );

    if (resposta.status >= 400) return erro(codigoErroPorStatus(resposta.status));

    const { token, dadosPublicos } = separarTokenDeSessao(resposta.data?.data);

    if (token) {
      await iniciarSessao(contexto, token);

      return NextResponse.redirect(urlAposLogin(req, contexto), 303);
    }

    // 2FA habilitado: o backend devolve só o `temp_token` (sem sessão até o código ser validado).
    const tempToken = dadosPublicos?.temp_token;

    if (dadosPublicos?.["2fa_enable"] === true && typeof tempToken === "string" && tempToken !== "") {
      return NextResponse.redirect(urlSegundoFator(req, contexto, tempToken), 303);
    }

    return erro("indisponivel");
  } catch (e) {
    if (e instanceof SessaoIndisponivelError) return respostaSessaoIndisponivel();

    return erro("indisponivel");
  }
}
