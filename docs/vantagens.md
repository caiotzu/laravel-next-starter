# Vantagens do projeto

O que esta base entrega e por que as decisões de arquitetura foram tomadas assim.

---

## Para o negócio

- **Começa pronto** — usuários, permissões, empresas, mensagens, banners, chamados, novidades, dashboard e auditoria já funcionam.
- **Multi-empresa de verdade** — cada cliente enxerga só os próprios dados, garantido por construção e por testes.
- **Duas áreas prontas** — painel interno (Admin) e portal do cliente (Private), com o mesmo padrão.
- **Suporte seguro** — o Admin só entra na conta do cliente com a autorização dele, por tempo limitado e com auditoria.
- **Rastreável** — toda alteração importante fica registrada (quem, o quê, quando).

## Para segurança

- **JWT nunca chega ao navegador** — fica no servidor (Redis); o navegador só tem um cookie opaco.
- **Camadas de proteção** — 2FA, limites de requisição, CSP com nonce, validação de origem, sanitização de HTML e arquivos privados com link assinado. Lista completa em [`seguranca.md`](./seguranca.md).
- **Conferência de produção automática** — dois comandos acusam configuração insegura antes de publicar.

## Para quem desenvolve

- **Estrutura previsível** — cada recurso segue o mesmo caminho (Controller → Request → DTO → Service → Model → Resource; `domains/` + `features/` no frontend).
- **Sem abstração desnecessária** — Repository só onde há dado com dono; sem interfaces por hábito.
- **Integrações trocáveis por configuração** — e-mail, CEP e armazenamento de arquivos (disco ou S3).
- **Swagger embutido** — a documentação da API vive nos controllers e nunca fica desatualizada.
- **Testado** — Pest com banco real, Vitest e Playwright; guardas arquiteturais falham se alguém quebrar as regras.
- **CI com auditoria de dependências** e ambiente local de um comando (Docker/Sail).

---

## Limitações a ter em mente

- O frontend **depende do Redis**: sem ele ninguém entra.
- O frontend é um BFF no Next.js (processo Node próprio): publicar exige servir dois sistemas, não um.
- Não há pentest independente, apenas revisão do código e testes automáticos.
- Os testes E2E usam backend simulado e não rodam no CI.
- Uploads chegam em base64 no JSON (limites de 2 a 10 MB).
