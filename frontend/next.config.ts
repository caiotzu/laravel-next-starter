import type { NextConfig } from "next";

/**
 * Headers de segurança aplicados a todas as rotas.
 *
 * A Content-Security-Policy das PÁGINAS (com `script-src` e nonce por requisição) é montada em
 * `proxy.ts` / `lib/security/csp.ts`: o nonce muda a cada resposta e não cabe numa configuração
 * estática. Aqui fica só a CSP da API (abaixo). `/storage` é atendido por um Route Handler
 * (`app/storage/[...caminho]/route.ts`) que já devolve os próprios cabeçalhos.
 */
const cabecalhosDeSeguranca = [
  // Impede que o app seja embutido em <iframe> de outro site (clickjacking). O app não usa iframes.
  // (O `frame-ancestors` da CSP das páginas está em proxy.ts; este é o equivalente legado.)
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // As páginas de redefinir senha/primeiro acesso carregam o token na URL: não vaza em Referer.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
];

// HSTS só em produção (em http://localhost ele seria ignorado/indesejado).
if (process.env.NODE_ENV === "production") {
  cabecalhosDeSeguranca.push({
    key: "Strict-Transport-Security",
    value: "max-age=31536000",
  });
}

const nextConfig: NextConfig = {
  // Não anuncia a tecnologia do servidor no cabeçalho `X-Powered-By: Next.js` (reduz o fingerprinting).
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: cabecalhosDeSeguranca,
      },
      // API: só devolve JSON, nunca precisa carregar nada.
      {
        source: "/api/:path*",
        headers: [{ key: "Content-Security-Policy", value: "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'" }],
      },
    ];
  },
};

export default nextConfig;
