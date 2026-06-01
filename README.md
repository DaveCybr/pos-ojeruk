# 🍊 POS O-JERUK

Sistem kasir multi-cabang untuk outlet jeruk. Dibangun dengan React + Express.js + PostgreSQL.

## Quick Start

### Backend
```bash
cd server
cp .env.example .env       # isi DATABASE_URL dan JWT secrets
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

### Frontend
```bash
cd client
cp .env.example .env
npm install
npm run dev
```

## Akun Default (setelah seed)
| Role    | Email                       | Password |
|---------|-----------------------------|----------|
| Admin   | admin@ojeruk.com            | password |
| Gudang  | gudang@ojeruk.com           | password |
| Kasir   | kasir.jember@ojeruk.com     | password |
| Kasir   | kasir.sby@ojeruk.com        | password |

## Dokumentasi
- `AGENT.md` — arsitektur & context proyek lengkap
- `DESIGN.md` — design system & UI guidelines

## Tech Stack
- **Frontend**: React 19 + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + Prisma ORM
- **Database**: PostgreSQL
- **Real-time**: Socket.io
