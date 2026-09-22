<?php

/**
 * Proxies confiáveis (lidos pelo middleware TrustProxies do Laravel).
 *
 * Neste projeto o navegador NUNCA fala direto com a API: quem chama o Laravel é o servidor
 * Next.js (BFF), então `$request->ip()` só devolve o IP do usuário final se o Laravel
 * confiar no BFF e ler o X-Forwarded-For enviado por ele. Sem isso, todos os rate limits
 * por IP (login, 2FA, api-publica...) enxergam o mesmo IP (o do servidor Next) e viram
 * limites globais compartilhados por todos os usuários.
 *
 * TRUSTED_PROXIES aceita uma lista de IPs/CIDRs separados por vírgula (recomendado, ex.:
 * "10.0.0.5,172.18.0.0/16") ou "*" para confiar em quem chama (SÓ use "*" se a API não for
 * acessível diretamente pela internet, apenas pelo BFF/rede privada — caso contrário
 * qualquer cliente poderia forjar o X-Forwarded-For).
 *
 * Vazio/null = não confia em nenhum proxy (comportamento padrão do Laravel).
 */
$proxies = trim((string) env('TRUSTED_PROXIES', ''));

return [
    // Em branco vira null (e não [''] ), para o TrustProxies não confiar em ninguém.
    'proxies' => $proxies === '' ? null : $proxies,
];
