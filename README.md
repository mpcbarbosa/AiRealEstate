# ImoRadar — CRM Imobiliário

Hub operacional de oportunidades imobiliárias em Portugal, alimentado por agentes Gobii.

## Stack
- **Next.js 14** (App Router) + TypeScript
- **Tailwind CSS** para UI
- **Prisma ORM** + **PostgreSQL**
- **NextAuth.js** para autenticação
- Deploy: **Render** (Web Service + Postgres)

## Setup Local

### Pré-requisitos
- Node.js 18+
- PostgreSQL local (ou Docker)

### Instalação

```bash
git clone https://github.com/mpcbarbosa/AiRealEstate
cd AiRealEstate
npm install
```

### Configurar variáveis de ambiente

Copia `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edita `.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/imoradar"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="qualquer-string-secreta"
GOBII_API_KEY="chave-para-ingest"
NODE_ENV="development"
```

### Base de dados

```bash
# Criar tabelas
npx prisma db push

# Popular com dados de exemplo
npm run seed
```

### Iniciar

```bash
npm run dev
```

Acede a [http://localhost:3000](http://localhost:3000)

**Login demo:** `demo@imoradar.pt` / `demo12345`

---

## Deploy no Render

### Variáveis de ambiente (Render Web Service)

| Var | Descrição |
|-----|-----------|
| `DATABASE_URL` | Internal Database URL do Render Postgres |
| `NEXTAUTH_URL` | URL do teu serviço (ex: https://imoradar.onrender.com) |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `GOBII_API_KEY` | `openssl rand -hex 32` |
| `NODE_ENV` | `production` |

### Build & Start Commands (Render)

- **Build:** `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
- **Start:** `npm start`

### Healthcheck

`GET /api/health` — retorna `{ "status": "ok", "db": "connected" }`

---

## Ingest API (Gobii)

Ver documentação completa em [`docs/gobii-ingest.md`](docs/gobii-ingest.md)

**Endpoint:** `POST /api/ingest/gobii/listings`  
**Header:** `X-API-KEY: <chave>`

---

## Estrutura do Projeto

```
app/
├── (auth)/          # Login, Registo
├── (app)/           # App autenticada
│   ├── listings/    # Lista + Detalhe
│   ├── watchlists/  # Alertas
│   ├── settings/    # API Keys
│   └── admin/ingest # Observabilidade
├── api/             # Route Handlers
lib/
├── prisma.ts        # Cliente DB
├── auth.ts          # NextAuth config
└── utils.ts         # Helpers
prisma/
├── schema.prisma    # Modelos
└── seed.ts          # Dados demo
docs/
├── gobii-ingest.md  # Contrato API
└── dedupe.md        # Heurísticas dedupe
```
