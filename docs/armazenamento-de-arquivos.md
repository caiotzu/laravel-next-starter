# Armazenamento de arquivos

Todo arquivo gravado pela aplicação passa por **uma única interface**, `FileStorageInterface`. As regras de negócio não conhecem disco nem S3.

```text
Service → FileStorageInterface → LaravelFileStorage → disco do Laravel (local ou s3)
```

---

## O que é guardado

| Arquivo | Visibilidade | Caminho no banco | Entrega |
|---|---|---|---|
| Avatar | pública | `avatars/{uuid}.png\|jpg` | URL direta |
| Imagem de banner | pública | `banners/{banner_id}/{uuid}.{ext}` | URL direta |
| Anexo de chamado | **privada** | `chamados/{chamado_id}/{uuid}.{ext}` | link assinado e temporário |

💡 O banco guarda **só o caminho relativo**. Por isso trocar de provider não exige alterar registros.

---

## Configuração (`config/api.php` → `storage`)

### Disco local (padrão)

```env
FILE_STORAGE_DRIVER=local
```

- Público → `storage/app/public` (exige `php artisan storage:link`).
- Privado → `storage/app/private` (nunca exposto).

### S3 (ou compatível: MinIO, R2, Spaces)

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
```

Um bucket, dois prefixos: `public/` (legível pela internet) e `private/` (**nunca** público).

**Migrar arquivos existentes** (os caminhos no banco não mudam). Copie **antes** de trocar o driver:

```bash
aws s3 sync backend/storage/app/public  s3://meu-bucket/public/
aws s3 sync backend/storage/app/private s3://meu-bucket/private/
```

---

## Usar na aplicação

```php
public function __construct(private FileStorageInterface $arquivos) {}

$this->arquivos->put(ArquivoVisibilidade::PUBLICO, 'avatars/' . Str::uuid() . '.png', $conteudo);
$this->arquivos->delete(ArquivoVisibilidade::PUBLICO, $caminho);
```

| Método | Uso |
|---|---|
| `put`, `delete`, `exists`, `size` | gravar, remover, conferir |
| `url(caminho)` | URL de arquivo **público** |
| `response(...)` | entrega em *stream* de arquivo **privado** |
| `move(de, para, caminho)` | mover entre visibilidades |

- `put` e `delete` devolvem `false` em falha de I/O; quem chama decide o que fazer.
- Ao ler o caminho de um model com accessor de URL (`Usuario::avatar`, etc.), use `getRawOriginal()`; o accessor devolve a URL, não o caminho.

## Adicionar outro provider

- **Tem adapter Flysystem** (SFTP, Azure, GCS…): registre o disco no Laravel e aponte para ele em `config/api.php → storage.drivers`; não precisa de classe nova.
- **Implementação própria:** crie uma classe que implemente `FileStorageInterface` e registre-a na mesma configuração.

---

## Segurança

- Caminhos são **sempre gerados pelo servidor** (uuid + extensão de uma lista fixa, derivada do tipo real do arquivo).
- Path traversal (`../`, caminho absoluto, byte nulo) é recusado.
- Tamanho e tipo são validados nos Form Requests e Services.

⚠️ **Limites conhecidos:** uploads chegam em base64 no JSON e o conteúdo decodificado fica em memória (avatar 2 MB, banner 5 MB, anexo 10 MB).
