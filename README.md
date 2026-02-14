# :rocket: Laravel 12 (Backend) + Next.js 15 (Frontend)

Boilerplate **full stack** construído com **Laravel 12** e **Next.js 15**, desenvolvido para servir como uma base robusta, escalável e segura para aplicações web modernas.

O projeto tem como foco acelerar o desenvolvimento de novos produtos ao fornecer uma **estrutura arquitetural pronta**, com **autenticação**, **controle de acesso baseado em grupos e permissões**, e padrões bem definidos desde o início. Essa abordagem reduz retrabalho, garante consistência entre projetos e facilita a evolução do sistema à medida que novas funcionalidades são adicionadas.

A solução foi pensada para cenários que exigem **crescimento contínuo**, **organização de código**, **segurança** e **manutenibilidade**, sendo adequada tanto para projetos internos quanto para produtos comerciais.

---

## :rocket: Tecnologias

Tecnologias, frameworks e ferramentas utilizadas na construção da aplicação:

### Backend
- **Laravel 12** — Framework PHP para APIs escaláveis e seguras
- **PHP** — Linguagem principal do backend
- **PostgreSQL** — Banco de dados relacional
- **Docker** — Containerização do ambiente
- **Composer** — Gerenciamento de dependências PHP

### Frontend
- **Next.js 15** — Framework React para aplicações modernas
- **React** — Biblioteca para construção de interfaces
- **TypeScript** — Tipagem estática para maior segurança e produtividade
- **JavaScript** — Linguagem base do frontend
- **Vite** — Ferramenta de build e desenvolvimento
- **Tailwind CSS** — Estilização utilitária e responsiva
- **shadcn/ui** — Componentes UI prontos, acessíveis e estilizados com Tailwind CSS

---

## :link: Requisitos

Para executar o projeto em ambiente de desenvolvimento, é necessário possuir os seguintes pré-requisitos instalados:

- **Node.js** (ambiente JavaScript)
- **NPM ou Yarn** (gerenciador de pacotes)
- **Docker** (execução do ambiente em containers)
- **Composer** (gerenciamento de dependências PHP)

---

## :computer: Execução do Projeto

### Backend

1. Acesse a pasta do backend:
```
cd backend
```

2. Instale as dependências:
```
composer install
```

3. Inicialize o Docker usando o Sail:
```
./vendor/bin/sail up -d
```

4. Entre no container do backend:
```
docker exec -it backend-laravel.test-1 /bin/bash
```

5. Configure o arquivo `.env` conforme necessário (copie de `.env.example`):
```
cp .env.example .env
```

6. Gere a chave do Laravel:
```
php artisan key:generate
```

7. Gere a chave do JWT:
```
php artisan jwt:secret
```

8. Execute as migrations e seeders:
```
php artisan migrate --seed
```

8. Certifique-se de **configurar e executar os JOBs** para processar tarefas assíncronas e filas, caso necessário.

---

### Frontend

1. Acesse a pasta do frontend:
```
cd frontend
```

2. Instale as dependências:
```
npm install
# ou
yarn install
```

3. Configure o arquivo `.env.local` conforme necessário (copie de `.env.local.example`):
```
cp .env.local.example .env.local
```

4. Execute o servidor de desenvolvimento:
```
npm run dev
# ou
yarn dev
```

5. O frontend estará disponível normalmente em **http://localhost:3000**

