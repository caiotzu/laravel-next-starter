# Redis de produção (sessões do BFF Next.js)

O Redis guarda as **sessões** do frontend (`bff:sess:*`). Sem Redis ninguém consegue entrar (o login responde 503) e, se ele perder os dados, todos são deslogados. Por isso: rede privada, senha, TLS, `noeviction` e persistência.

O backend Laravel **não** usa este Redis (cache e fila usam o banco). Não reaproveite o Redis de outro sistema.

## O que precisa estar ligado

| Requisito | Por quê | Como |
|---|---|---|
| Rede privada | Redis nunca deve ser acessível pela internet | firewall/security group liberando só o(s) servidor(es) Next.js |
| Senha (`requirepass` ou ACL) | sem ela, qualquer um na rede lê/forja sessões | `redis.conf` abaixo |
| TLS | a senha e os tokens não podem trafegar em texto puro | `tls-port` + certificado |
| `maxmemory-policy noeviction` | outra política descarta sessões em silêncio | `redis.conf` |
| AOF (`appendonly yes`) | reiniciar o Redis não desloga todo mundo | `redis.conf` |

## `redis.conf` de referência

```conf
# Só TLS: porta sem criptografia desligada.
port 0
tls-port 6380
tls-cert-file /etc/redis/tls/redis.crt
tls-key-file  /etc/redis/tls/redis.key
tls-ca-cert-file /etc/redis/tls/ca.crt
# O Next.js autentica por senha. Se quiser certificado de cliente (mTLS), mude para "yes"
# e configure o cliente (ver "Variações").
tls-auth-clients no
tls-protocols "TLSv1.2 TLSv1.3"

# Senha longa e aleatória (>= 32 caracteres): openssl rand -base64 36
requirepass <SENHA-FORTE>

# Sessões não podem ser descartadas.
maxmemory 512mb
maxmemory-policy noeviction

# Persistência.
appendonly yes
appendfsync everysec

# Escuta só na interface privada.
bind <IP-PRIVADO-DO-REDIS>
protected-mode yes
```

Ajuste `maxmemory` ao seu volume (uma sessão ocupa poucos KB). Com `noeviction`, se encher, novos logins falham em vez de derrubar sessões: configure alerta de uso de memória.

## Certificado

Use o certificado emitido pela sua CA interna (ou do provedor, em Redis gerenciado). O nome do host na `REDIS_URL` precisa constar no certificado (CN/SAN). Para uma CA própria, o Node precisa confiar nela: defina `NODE_EXTRA_CA_CERTS=/caminho/ca.crt` no serviço do Next.js.

Certificado de teste (NÃO use em produção):

```
openssl req -x509 -newkey rsa:2048 -nodes -keyout ca.key -out ca.crt -days 365 -subj "/CN=minha-ca"
openssl req -newkey rsa:2048 -nodes -keyout redis.key -out redis.csr -subj "/CN=redis.interno"
printf "subjectAltName=DNS:redis.interno" > ext.cnf
openssl x509 -req -in redis.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out redis.crt -days 365 -extfile ext.cnf
```

## Docker Compose de referência

```yaml
services:
  redis:
    image: redis:7
    command: ["redis-server", "/etc/redis/redis.conf"]
    volumes:
      - ./redis.conf:/etc/redis/redis.conf:ro
      - ./tls:/etc/redis/tls:ro
      - redis-data:/data
    restart: unless-stopped
    networks: [interna]
    # NÃO publique a porta (sem "ports:"): só a rede "interna" enxerga o Redis.
volumes:
  redis-data:
networks:
  interna:
    internal: true
```

No `redis.conf` use `bind 0.0.0.0` dentro do container (a proteção é a rede `internal`) e `dir /data`.

## `REDIS_URL` do frontend

```
REDIS_URL="rediss://:<SENHA>@redis.interno:6380"
```

- `rediss://` (dois "s") liga o TLS; `redis://` não.
- Caracteres especiais na senha precisam ser codificados na URL: `@` vira `%40`, `:` vira `%3A`, `/` vira `%2F`, `#` vira `%23`, `?` vira `%3F`, `%` vira `%25`. Ou escolha uma senha só com letras e números.

## Como conferir

No servidor do Next.js (com as variáveis de produção carregadas):

```
npm run verificar:producao
```

Ele conecta de verdade e acusa: Redis sem senha, política diferente de `noeviction`, AOF desligado, TLS ausente. Manualmente:

```
redis-cli --tls --cacert ca.crt -h redis.interno -p 6380 ping            # NOAUTH (recusado sem senha)
redis-cli --tls --cacert ca.crt -h redis.interno -p 6380 -a '<SENHA>' ping  # PONG
redis-cli --tls --cacert ca.crt -h redis.interno -p 6380 -a '<SENHA>' config get maxmemory-policy
```

## Variações

- **Redis gerenciado** (ElastiCache, Upstash, etc.): o provedor cuida de TLS e persistência; ative "in-transit encryption" e "auth token", confira `noeviction` no painel (o `CONFIG` costuma ser bloqueado, e o verificador avisa em vez de falhar).
- **ACL em vez de `requirepass`**: crie um usuário só com os comandos usados e use `rediss://usuario:senha@host:6380`.
- **Alta disponibilidade**: a aplicação fala com um único endpoint; use o endpoint do primário do serviço gerenciado (ou Sentinel/Cluster na frente, com um endpoint único).
