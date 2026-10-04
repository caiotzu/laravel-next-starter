import type { NextConfig } from "next";

/**
 * Headers de segurança aplicados a todas as rotas.
 *
 * Não inclui um Content-Security-Policy completo (script-src/style-src) de propósito: o Next
 * injeta scripts/estilos inline e um CSP estrito exige nonces por requisição (proxy.ts) —
 * fica como evolução. Aqui vão as diretivas que NÃO quebram a aplicação e fecham riscos reais:
 * clickjacking (frame-ancestors), <base> e <form> sequestrados e plugins (object-src).
 */
const cabecalhosDeSeguranca = [
  // Impede que o app seja embutido em <iframe> de outro site (clickjacking). O app não usa iframes.
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
  { key: "X-Frame-Options", value: "DENY" }, // equivalente legado do frame-ancestors
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

/**
 * Origem do backend que serve os arquivos públicos (`/storage/...`: avatar e
 * imagens de banner). As URLs chegam ao navegador como caminho relativo
 * (ver lib/media-url.ts) e este rewrite as encaminha ao backend pelo servidor
 * Next, o que funciona igual em `next dev` e depois do `next build`.
 * `BACKEND_STORAGE_URL` é opcional; por padrão usa a origem de `BACKEND_URL`.
 */
function origemDoStorage(): string | null {
  const bruto = process.env.BACKEND_STORAGE_URL || process.env.BACKEND_URL;

  if (!bruto) return null;

  try {
    return new URL(bruto).origin;
  } catch {
    return null;
  }
}

const nextConfig: NextConfig = {
  async rewrites() {
    const origem = origemDoStorage();

    if (!origem) return [];

    return [
      {
        source: "/storage/:path*",
        destination: `${origem}/storage/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: cabecalhosDeSeguranca,
      },
    ];
  },
};

export default nextConfig;
