import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import axios from "axios";

import { separarTokenDeSessao } from "@/lib/auth-response";
import { ipsEncaminhados } from "@/lib/client-ip";
import {
  SessaoIndisponivelError,
  iniciarSessao,
  respostaSessaoIndisponivel,
} from "@/lib/session/sessao";
import type { ContextoSessao } from "@/lib/session/tipos";
import {
  PROVEDOR_REGEX,
  caminhoBackendSocial,
  codigoErroPorStatus,
  gerarBinding,
  nomeCookieSocial,
  opcoesCookieSocial,
  urlAposLogin,
  urlAutorizacaoValida,
  urlLoginComErro,
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
    (await cookies()).set(nomeCookieSocial(contexto), binding, opcoesCookieSocial());

    return NextResponse.json({ data: { url } });
  } catch {
    return erroJson("Erro inesperado ao iniciar o login.", 500);
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

  // Uso único: o binding some do navegador mesmo se o fluxo falhar.
  if (binding !== undefined) cookieStore.set(nomeBinding, "", opcoesCookieSocial(0));

  const params = new URL(req.url).searchParams;
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
