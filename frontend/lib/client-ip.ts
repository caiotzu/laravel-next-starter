import { isIP } from "node:net";

/**
 * IP do usuário final para repassar ao backend (Laravel) em X-Forwarded-For / X-Real-IP.
 *
 * Por que existe: antes o BFF repassava o X-Forwarded-For que chegava na requisição SEM
 * validar. Se o Next estiver exposto (ou o proxy só "acrescentar" ao header do cliente), um
 * atacante forjaria o próprio IP e escaparia dos rate limits por IP do backend.
 *
 * Como funciona: TRUSTED_PROXY_HOPS = quantos proxies reversos SEUS (nginx, Cloudflare,
 * load balancer...) ficam na frente do Next e acrescentam ao X-Forwarded-For. O IP real do
 * cliente é o que o proxy MAIS PRÓXIMO do Next registrou, ou seja, contando da direita para a
 * esquerda. Tudo que vier à esquerda disso é controlado pelo cliente e é ignorado.
 *
 *   TRUSTED_PROXY_HOPS=1 (padrão)  -> um proxy na frente (o caso comum)
 *   TRUSTED_PROXY_HOPS=2           -> ex.: Cloudflare -> nginx -> Next
 *   TRUSTED_PROXY_HOPS=0           -> Next exposto direto: não há como saber o IP com
 *                                     segurança, então nada é repassado.
 *
 * O valor repassado é sempre UM único IP válido (nunca a cadeia inteira do cliente).
 */
function saltosConfiados(): number {
  const bruto = Number.parseInt(process.env.TRUSTED_PROXY_HOPS ?? "1", 10);

  return Number.isInteger(bruto) && bruto >= 0 ? bruto : 1;
}

export function obterIpCliente(req: Request): string {
  const saltos = saltosConfiados();

  if (saltos === 0) return "";

  const cadeia = (req.headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((parte) => parte.trim())
    .filter(Boolean);

  if (cadeia.length > 0) {
    const indice = Math.max(cadeia.length - saltos, 0);
    const candidato = cadeia[indice];

    if (isIP(candidato)) return candidato;
  }

  const realIp = (req.headers.get("x-real-ip") ?? "").trim();

  return isIP(realIp) ? realIp : "";
}

/** Headers de IP a enviar ao backend, sempre com o mesmo valor validado. */
export function ipsEncaminhados(req: Request): { forwardedFor: string; realIp: string } {
  const ip = obterIpCliente(req);

  return { forwardedFor: ip, realIp: ip };
}
