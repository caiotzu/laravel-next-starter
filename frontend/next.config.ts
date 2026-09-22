import type { NextConfig } from "next";

/**
 * Headers de segurança aplicados a todas as rotas.
 *
 * Não inclui um Content-Security-Policy completo (script-src/style-src) de propósito: o Next
 * injeta scripts/estilos inline e um CSP estrito exige nonces por requisição (middleware) —
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

const nextConfig: NextConfig = {
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
