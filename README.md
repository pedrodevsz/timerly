# Controle de Estudos — Orbe

Aplicação full-stack em Next.js 16 para organizar projetos, matérias e tópicos e registrar sessões de estudo com um cronômetro persistente.

## Arquitetura

O frontend usa React, Tailwind e componentes shadcn/Radix. O backend vive no mesmo projeto em `interface/src/app/api` e segue o fluxo:

```text
UI → services/api-client → Route Handler → service → repository → Prisma → PostgreSQL
```

- `interface/src/app/api`: endpoints REST e validação da borda HTTP.
- `interface/src/modules`: schemas Zod, serviços de domínio e repositories.
- `interface/src/lib/db`: Prisma Client reutilizável com adapter PostgreSQL.
- `interface/src/services`: acesso centralizado à API pelo frontend.
- `interface/src/types`: DTOs compartilhados, sem expor models internos do banco.
- `interface/prisma`: schema, migration inicial e seed.

As métricas do dashboard, progresso e streak são calculados a partir de tópicos e sessões. Não são duplicados em colunas.

## Configuração local

Requisitos: Node.js 22+, pnpm e PostgreSQL. Opcionalmente, use Docker.

```bash
cd interface
cp .env.example .env
docker compose up -d
pnpm install
pnpm db:generate
pnpm db:deploy
pnpm db:seed
pnpm dev
```

No PowerShell, substitua `cp` por `Copy-Item .env.example .env`.

Configure as duas conexões no `.env.local` (preferencial) ou `.env`:
`DATABASE_URL` deve apontar para o endpoint pooled do Neon e é usada somente
pelo runtime Next.js. `DIRECT_URL` deve apontar para o endpoint direto e é usada
pelo Prisma CLI, migrations e seed. A CLI carrega `.env.local` primeiro e usa
`.env` como fallback. As URLs são fornecidas pelo Neon e não são transformadas
pela aplicação.

Para criar uma nova migration durante o desenvolvimento:

```bash
pnpm db:migrate
```

Outros comandos úteis:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm db:validate
pnpm db:studio
```

## Endpoints

| Método | Endpoint | Função |
|---|---|---|
| GET, POST | `/api/projects` | Listar e criar projetos |
| GET, PATCH, DELETE | `/api/projects/:projectId` | Consultar, editar e excluir projeto |
| POST | `/api/projects/:projectId/subjects` | Criar matéria |
| PATCH, DELETE | `/api/subjects/:subjectId` | Editar e excluir matéria |
| POST | `/api/subjects/:subjectId/topics` | Criar tópico |
| PATCH, DELETE | `/api/topics/:topicId` | Editar, concluir e excluir tópico |
| GET, POST | `/api/study-sessions` | Listar e iniciar sessões |
| GET | `/api/study-sessions/active` | Restaurar cronômetro ativo |
| PATCH | `/api/study-sessions/:sessionId` | Pausar, retomar, trocar tópico ou encerrar |
| GET | `/api/dashboard` | Métricas derivadas e histórico recente |
| GET, PATCH | `/api/settings` | Perfil local e preferências |

Respostas de sucesso usam `{ "data": ... }`. Erros conhecidos usam `{ "error": { "code", "message", "details" } }` sem stack traces.

## Autenticação

Ainda não há autenticação. As configurações usam temporariamente o perfil de ID `local`, e a camada de serviço/repository deixa a associação a usuário isolada para uma evolução futura.


## Ajustes futuros 

#### add ou remover o button de nova imagem
#### Montar um registro de estudo manual para quando estudar mas não estiver contando.
