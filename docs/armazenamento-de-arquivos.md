# Armazenamento de arquivos

Todo arquivo gravado pela aplicação (avatar, imagens de banner, anexos de chamado) passa por **uma única abstração**, `App\Contracts\Storage\FileStorageInterface`. Regras de negócio não conhecem disco, S3 ou qualquer provider — só a interface.

```text
Controller / Command
        ↓
Service (PerfilService, BannerService, ChamadoService)
        ↓
FileStorageInterface
        ↓
LaravelFileStorage  →  disco do Laravel (local, s3, ...)   [config/api.php → 'storage']
```

## O que existe hoje

| Arquivo | Visibilidade | Caminho (guardado no banco) | Entrega |
|---|---|---|---|
| Avatar | pública | `avatars/{uuid}.png\|jpg` | URL direta |
| Imagem de banner | pública | `banners/{banner_id}/{uuid}.{ext}` | URL direta |
| Anexo de chamado | **privada** | `chamados/{chamado_id}/{uuid}.{ext}` | link assinado e temporário (`Global\ChamadoAnexoController`), em stream |

O banco guarda **somente o caminho relativo** — nunca disco, host ou URL. Por isso trocar de provider não exige alterar registros.

As tabelas `chamado_anexos` e `banner_imagens` já guardam nome original, MIME e tamanho; não há (nem foi criada) tabela genérica de arquivos, e nenhuma migration foi necessária.

## A interface

Só tem o que o código realmente usa:

| Método | Uso |
|---|---|
| `put(visibilidade, caminho, conteudo): bool` | gravar (o retorno é checado nos anexos de chamado) |
| `delete(visibilidade, caminho): bool` | remover (troca de avatar, imagem de banner removida) |
| `exists(visibilidade, caminho): bool` | download de anexo (inclui fallback de anexos legados) |
| `size(visibilidade, caminho): ?int` | conferência de tamanho |
| `url(caminho): string` | URL de arquivo **público** (avatar, banner) |
| `response(visibilidade, caminho, nome, cabeçalhos, disposição)` | entrega em **stream** de arquivo privado |
| `move(de, para, caminho): bool` | mover entre visibilidades por stream (comando `chamados:mover-anexos-privados`) |

`ArquivoVisibilidade` tem dois valores: `PUBLICO` e `PRIVADO`. Arquivo privado **não tem URL direta** por design. URLs temporárias (`temporaryUrl`) não existem na interface porque nenhum caso de uso as utiliza — os anexos continuam saindo pela rota assinada da própria aplicação.

Falhas de I/O não lançam exceção (os discos usam `'throw' => false`): `put`/`delete` devolvem `false` e quem chama decide. Caminhos inválidos (`../`, absoluto, vazio, byte nulo, `\`) lançam `InvalidArgumentException` na escrita/remoção/entrega e são tratados como inexistentes em `exists`/`size` (o download vira 404).

## Configuração

Tudo em `config/api.php` (chave `storage`), no mesmo padrão do `api.email.provider`. Nunca use `env()` fora dos arquivos de config.

### Local (padrão, sem custo)

```env
FILE_STORAGE_DRIVER=local
```

Público → disco `public` (`storage/app/public`, servido em `/storage/...`; exige `php artisan storage:link`).
Privado → disco `local` (`storage/app/private`, nunca exposto).

### S3

```bash
composer require league/flysystem-aws-s3-v3 "^3.0" --with-all-dependencies
```

```env
FILE_STORAGE_DRIVER=s3
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=meu-bucket
AWS_URL=https://cdn.exemplo.com     # URL pública do prefixo público
# AWS_ENDPOINT=...                  # MinIO / R2 / Spaces
# AWS_PUBLIC_ROOT=public            # padrão
# AWS_PRIVATE_ROOT=private          # padrão
```

Um bucket, dois prefixos (`config/filesystems.php`: discos `s3_public` e `s3_private`):

- `public/` precisa ser legível pela internet (bucket policy e/ou CDN). Não são enviados ACLs, então funciona em buckets com *Object Ownership = bucket owner enforced* (padrão atual da AWS);
- `private/` **não** pode ser público. Os anexos de chamado continuam sendo entregues pela aplicação (stream) após validar o link assinado.

**Migrando arquivos já existentes** (os caminhos no banco não mudam, só é preciso copiar os arquivos):

```bash
aws s3 sync backend/storage/app/public  s3://meu-bucket/public/
aws s3 sync backend/storage/app/private s3://meu-bucket/private/
```

Faça a cópia **antes** de trocar `FILE_STORAGE_DRIVER`.

## Adicionar um novo provider

**Caso 1 — o provider tem adapter Flysystem** (SFTP, Azure, GCS, GridFS, ...): não escreva classe nova. Registre o disco do Laravel (`Storage::extend()` + entrada em `config/filesystems.php`) e aponte para ele:

```php
// config/api.php → storage.drivers
'gridfs' => [
    'adapter' => \App\Services\Storage\LaravelFileStorage::class,
    'discos'  => ['publico' => 'gridfs_publico', 'privado' => 'gridfs_privado'],
],
```

```env
FILE_STORAGE_DRIVER=gridfs
```

**Caso 2 — implementação própria**: crie uma classe que implemente `FileStorageInterface` e registre-a:

```php
'meu_provider' => ['adapter' => \App\Services\Storage\MeuProviderFileStorage::class],
```

O binding (`AppServiceProvider`) resolve o adapter pela configuração — não há `if/switch` de driver no código. `tests/Support/ArquivosEmMemoria.php` é um exemplo mínimo de implementação.

> **MongoDB/GridFS:** não foi implementado. O projeto usa PostgreSQL e não tem Mongo; adicionar um servidor só para arquivos aumenta custo e operação sem ganho hoje. A arquitetura já permite plugá-lo depois pelo Caso 1.

## Usando na aplicação

```php
// Em um Service (injeção pelo container):
public function __construct(private FileStorageInterface $arquivos) {}

$this->arquivos->put(ArquivoVisibilidade::PUBLICO, 'avatars/' . Str::uuid() . '.png', $conteudo);
$this->arquivos->delete(ArquivoVisibilidade::PUBLICO, $usuario->getRawOriginal('avatar'));

// Entrega em stream de arquivo privado (ChamadoAnexoController):
return $this->arquivos->response(ArquivoVisibilidade::PRIVADO, $caminho, $nomeOriginal, $cabecalhos, 'attachment');

// Em Models (sem injeção):
app(FileStorageInterface::class)->url($caminho);
```

Ao ler o caminho de um model que possui accessor de URL (`Usuario::avatar`, `BannerImagem::caminho`, `ChamadoAnexo::caminho`), use `getRawOriginal()` / `caminhoArmazenado()` — o accessor devolve a URL, não o caminho.

## Segurança

- Caminhos são **sempre gerados pelo servidor** (`uuid` + extensão de uma lista fixa derivada do MIME real via `finfo`); o nome enviado pelo usuário é guardado apenas como rótulo (`nome_original`) e nunca vira caminho;
- `LaravelFileStorage` recusa path traversal por conta própria (defesa em profundidade além do Flysystem);
- tamanho e tipo continuam validados nos `Form Requests`/Services como antes; nada disso mudou;
- isolamento entre empresas: continua garantido pela autorização das rotas e pelo link assinado, não pela estrutura de pastas.

## Pontos conhecidos (fora do escopo desta mudança)

- Os uploads chegam em base64 no JSON e o conteúdo decodificado fica em memória (limites: avatar 2 MB, banner 5 MB, anexo 10 MB). `move` e a entrega de anexos já usam streams;
- `BannerService` e `PerfilService` não verificam o retorno de `put()` (comportamento anterior preservado); `ChamadoService` verifica e responde erro de negócio. Se quiser o mesmo rigor, basta checar `false` e lançar `BusinessException`.
