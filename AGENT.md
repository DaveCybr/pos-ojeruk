# AGENT.md — POS O-JERUK

> Dokumen ini adalah sumber kebenaran tunggal untuk proyek POS O-JERUK.
> Baca seluruh file ini sebelum menulis satu baris kode pun.

---

## 1. Gambaran Proyek

**POS O-JERUK** adalah aplikasi kasir multi-cabang untuk outlet jeruk.
Setiap cabang menggunakan tablet sebagai perangkat kasir. Bagian gudang
dapat memantau stok semua cabang secara real-time dan menerima notifikasi
restok otomatis. Owner dapat memantau laporan penjualan semua cabang.

---

## 2. Tech Stack

| Layer      | Teknologi                                      |
|------------|------------------------------------------------|
| Frontend   | React 19 + Vite + Tailwind CSS                 |
| Backend    | Express.js + Node.js                           |
| Database   | PostgreSQL                                     |
| ORM        | Prisma                                         |
| Auth       | JWT (access token + refresh token)             |
| Real-time  | Socket.io                                      |
| Deployment | Railway (backend + DB) / Vercel (frontend)     |

---

## 3. Struktur Folder

```
pos-ojeruk/
├── client/                        # React frontend
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── ui/                # Komponen reusable (Button, Modal, dll)
│   │   │   ├── layout/            # Sidebar, Navbar, Layout wrapper
│   │   │   └── shared/            # Komponen lintas fitur
│   │   ├── features/              # Fitur dikelompokkan per domain
│   │   │   ├── auth/
│   │   │   ├── pos/               # Modul kasir
│   │   │   ├── products/
│   │   │   ├── stock/
│   │   │   ├── warehouse/         # Monitoring & restok gudang
│   │   │   ├── transactions/
│   │   │   ├── customers/
│   │   │   ├── branches/
│   │   │   ├── reports/
│   │   │   └── users/
│   │   ├── hooks/                 # Custom React hooks
│   │   ├── lib/                   # axios instance, socket, utils
│   │   ├── stores/                # Zustand global state
│   │   ├── types/                 # TypeScript types/interfaces
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts
│   └── tailwind.config.ts
│
├── server/                        # Express.js backend
│   ├── src/
│   │   ├── controllers/           # Handler per resource
│   │   ├── routes/                # Route definitions
│   │   ├── middlewares/           # auth, error handler, validator
│   │   ├── services/              # Business logic
│   │   ├── socket/                # Socket.io event handlers
│   │   ├── utils/                 # helpers, response formatter
│   │   └── app.ts                 # Express app setup
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── .env.example
│   └── server.ts                  # Entry point
│
└── AGENT.md                       # File ini
```

---

## 4. Skema Database (Prisma)

Semua tabel menggunakan UUID sebagai primary key.
Semua tabel memiliki `created_at` dan `updated_at` kecuali disebutkan lain.

### Tabel Utama

```
users            — id, name, email, password, role, branch_id
branches         — id, name, address, city, is_active
categories       — id, name, description
products         — id, name, barcode, category_id, price, cost_price, unit, image_url, is_active
stock            — id, product_id, branch_id, quantity, min_stock, updated_at
stock_movements  — id, product_id, branch_id, user_id, type, quantity, note
restock_requests — id, branch_id, product_id, requested_by, quantity_requested, status, note
customers        — id, name, phone
transactions     — id, invoice_no, branch_id, cashier_id, customer_id, subtotal, discount, tax, total, paid_amount, change_amount, payment_method, status
transaction_items— id, transaction_id, product_id, quantity, price, discount, subtotal
held_transactions— id, branch_id, cashier_id, label, cart_data (JSON)
```

### Enum Values

```
role:             ADMIN | WAREHOUSE | CASHIER
stock_movements.type: IN | OUT | ADJUSTMENT | RESTOCK
restock_requests.status: PENDING | APPROVED | REJECTED | FULFILLED
transactions.status: COMPLETED | VOIDED | HELD
transactions.payment_method: CASH | TRANSFER | QRIS
```

---

## 5. Role & Akses

| Role        | Akses                                                                 |
|-------------|-----------------------------------------------------------------------|
| `ADMIN`     | Semua fitur: cabang, user, produk, laporan global, stok semua cabang  |
| `WAREHOUSE` | Monitor stok semua cabang, kelola restock request, stock movement     |
| `CASHIER`   | Transaksi di cabang sendiri, lihat stok cabang sendiri, request restok|

Setiap kasir hanya bisa akses data `branch_id` miliknya sendiri.
Admin & Warehouse bisa akses semua cabang.

---

## 6. API Endpoint

Base URL: `/api/v1`

### Auth
```
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout
GET    /auth/me
```

### Branches
```
GET    /branches
POST   /branches
GET    /branches/:id
PUT    /branches/:id
DELETE /branches/:id
```

### Users
```
GET    /users
POST   /users
GET    /users/:id
PUT    /users/:id
DELETE /users/:id
```

### Categories
```
GET    /categories
POST   /categories
PUT    /categories/:id
DELETE /categories/:id
```

### Products
```
GET    /products
POST   /products
GET    /products/:id
GET    /products/barcode/:barcode
PUT    /products/:id
DELETE /products/:id
```

### Stock
```
GET    /stock                        # stok semua cabang (ADMIN/WAREHOUSE)
GET    /stock/branch/:branch_id      # stok per cabang
GET    /stock/low                    # produk stok rendah (di bawah min_stock)
POST   /stock/adjustment             # koreksi stok manual
GET    /stock/movements              # riwayat pergerakan stok
```

### Restock Requests
```
GET    /restock-requests
POST   /restock-requests             # kasir mengajukan
PUT    /restock-requests/:id/status  # warehouse update status
```

### Transactions
```
GET    /transactions
POST   /transactions                 # buat transaksi baru
GET    /transactions/:id
GET    /transactions/branch/:id      # per cabang
PUT    /transactions/:id/void        # void transaksi
```

### Held Transactions
```
GET    /held-transactions/branch/:id
POST   /held-transactions
DELETE /held-transactions/:id
```

### Customers
```
GET    /customers
POST   /customers
GET    /customers/:id
GET    /customers/:id/history        # riwayat transaksi pelanggan
```

### Reports
```
GET    /reports/sales                # laporan penjualan (filter: branch, date)
GET    /reports/profit               # laporan profit
GET    /reports/stock                # laporan stok
GET    /reports/summary              # ringkasan dashboard
```

---

## 7. Real-time Events (Socket.io)

### Rooms
Setiap cabang punya room: `branch:{branch_id}`
Admin/Warehouse join room: `warehouse`

### Events yang di-emit server → client

| Event                  | Room          | Payload                                      |
|------------------------|---------------|----------------------------------------------|
| `transaction:new`      | branch + warehouse | `{ transaction, branch_id }`            |
| `stock:updated`        | branch + warehouse | `{ product_id, branch_id, quantity }`   |
| `stock:low`            | warehouse     | `{ product_id, branch_id, quantity, min_stock }` |
| `restock:requested`    | warehouse     | `{ restock_request }`                        |
| `restock:status`       | branch        | `{ restock_request_id, status }`             |

### Events yang di-emit client → server

| Event           | Keterangan                          |
|-----------------|-------------------------------------|
| `join:branch`   | Kasir join room cabangnya            |
| `join:warehouse`| Warehouse/Admin join monitoring room |

---

## 8. Middleware Stack (Express)

```
app.use(cors())
app.use(helmet())
app.use(express.json())
app.use(morgan('dev'))
app.use('/api/v1', rateLimiter)
app.use('/api/v1', router)
app.use(errorHandler)         // global error handler terakhir
```

### Auth Middleware
```
authenticate   — verifikasi JWT, attach user ke req.user
authorize(...roles) — cek role, contoh: authorize('ADMIN', 'WAREHOUSE')
ownBranch      — pastikan kasir hanya akses branch_id miliknya
```

---

## 9. Response Format

Semua response menggunakan format standar:

```json
// Success
{
  "success": true,
  "message": "Data berhasil diambil",
  "data": { ... }
}

// Success list
{
  "success": true,
  "message": "Data berhasil diambil",
  "data": [ ... ],
  "meta": {
    "total": 100,
    "page": 1,
    "per_page": 20,
    "last_page": 5
  }
}

// Error
{
  "success": false,
  "message": "Pesan error yang jelas",
  "errors": [ ... ]   // opsional, untuk validation errors
}
```

HTTP status codes: 200 OK, 201 Created, 400 Bad Request,
401 Unauthorized, 403 Forbidden, 404 Not Found, 422 Unprocessable,
500 Internal Server Error.

---

## 10. Aturan Bisnis Penting

1. **Stok otomatis berkurang** saat transaksi `COMPLETED`.
   Gunakan Prisma transaction (`prisma.$transaction`) agar atomik.

2. **Notifikasi low stock** dikirim via Socket.io ke room `warehouse`
   setiap kali stok produk turun di bawah atau sama dengan `min_stock`.

3. **Invoice number** format: `INV-{BRANCH_CODE}-{YYYYMMDD}-{XXXX}`
   contoh: `INV-JBR-20260601-0001`. Auto-increment per hari per cabang.

4. **Void transaksi** hanya bisa dilakukan oleh `ADMIN`.
   Stok dikembalikan otomatis saat void.

5. **Hold transaction** menyimpan cart sebagai JSON. Tidak mengurangi stok.

6. **Kasir tidak bisa** melihat data cabang lain, laporan global,
   atau mengubah produk/harga.

7. **Restock request** dibuat kasir → warehouse approve/reject →
   jika `FULFILLED`, stok cabang otomatis bertambah dan tercatat
   di `stock_movements` dengan type `RESTOCK`.

8. **Password** di-hash dengan bcrypt (salt rounds: 12).

9. **JWT** access token expire: 15 menit.
   Refresh token expire: 7 hari, disimpan di httpOnly cookie.

---

## 11. UI/UX Guidelines (Frontend)

- **Layout tablet-first** — semua halaman harus nyaman di layar 768px–1024px touch
- **Modul kasir (POS)** harus bisa dioperasikan hanya dengan touch, tanpa keyboard
- Keyboard shortcuts tetap tersedia untuk desktop:
  - `/` atau `F5` → fokus search produk
  - `Escape` → clear/tutup modal
  - `F2` → submit transaksi
- **Warna tema**: oranye (`#F97316`) sebagai primary color — sesuai brand O-JERUK
- **Font**: Inter
- **Dark mode**: tidak wajib di v1
- Gunakan **Tailwind CSS** utility-first, hindari custom CSS kecuali terpaksa
- Komponen UI reusable wajib ada di `src/components/ui/`

---

## 12. Konvensi Kode

### Backend (Express + TypeScript)
- Gunakan `async/await`, bukan callback
- Semua route handler dibungkus `asyncHandler` untuk error propagation
- Validasi input menggunakan `zod`
- Prisma client di-instantiate sekali di `src/lib/prisma.ts`
- Jangan taruh logic bisnis di controller — pindahkan ke `services/`

### Frontend (React + TypeScript)
- Gunakan functional component + hooks
- State management: Zustand untuk global state (auth, cart, socket)
- Data fetching: TanStack Query (React Query)
- HTTP client: axios dengan instance terpusat di `src/lib/axios.ts`
- Socket client: instance terpusat di `src/lib/socket.ts`
- Setiap fitur punya folder sendiri di `src/features/{nama}/`
  dengan struktur: `index.tsx`, `components/`, `hooks/`, `api.ts`, `types.ts`

---

## 13. Environment Variables

### Server `.env`
```
DATABASE_URL=postgresql://user:pass@host:5432/pos_ojeruk
JWT_SECRET=
JWT_REFRESH_SECRET=
PORT=3000
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

### Client `.env`
```
VITE_API_URL=http://localhost:3000/api/v1
VITE_SOCKET_URL=http://localhost:3000
```

---

## 14. Urutan Pengerjaan (Development Order)

Ikuti urutan ini agar tidak ada dependency yang terlewat:

```
Phase 1 — Foundation
  [x] Setup monorepo struktur folder
  [x] Setup Prisma schema + migrasi awal
  [x] Setup Express app + middleware
  [x] Implementasi Auth (login, JWT, refresh token)
  [x] Setup React + Vite + Tailwind + React Query + Zustand

Phase 2 — Master Data
  [ ] CRUD Branches
  [ ] CRUD Users + role management
  [ ] CRUD Categories
  [ ] CRUD Products + upload gambar

Phase 3 — Stock & Warehouse
  [ ] Stock per cabang (read + adjustment)
  [ ] Stock movements log
  [ ] Restock request flow
  [ ] Socket.io setup + low stock notification

Phase 4 — POS / Kasir
  [ ] Modul kasir (cart, search barcode, diskon, kembalian)
  [ ] Proses transaksi + potong stok atomik
  [ ] Hold transaction
  [ ] Print receipt / thermal

Phase 5 — Reporting
  [ ] Dashboard summary
  [ ] Laporan penjualan
  [ ] Laporan profit
  [ ] Laporan stok

Phase 6 — Polish
  [ ] Optimasi performa query
  [ ] Tablet UI testing
  [ ] Seed data demo
```

---

## 15. Catatan Tambahan

- Proyek ini dikembangkan oleh Dave (PT Nano Indonesia Sakti)
- Repo: `DaveCybr/pos-ojeruk` (GitHub)
- Stack ini sengaja dipilih tanpa Supabase — backend mandiri di Railway
- Prioritas: fungsionalitas dulu, UI polish belakangan
- Jika ada ambiguitas, tanya dulu sebelum implement

---

*Terakhir diperbarui: Juni 2026*
