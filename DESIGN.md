# DESIGN.md — POS O-JERUK Design System

> Dokumen ini adalah panduan desain tunggal untuk POS O-JERUK.
> Setiap keputusan visual HARUS mengacu ke file ini.
> Jangan hardcode warna, font, atau spacing di luar sistem ini.

---

## 1. Design Philosophy

**Soft & Friendly** — UI terasa hangat, nyaman dipakai seharian di tablet kasir.
Tidak ada yang tajam, mencolok, atau membuat mata lelah.

Prinsip utama:
- **Warm** — warna berbasis oranye, pastel, dan krem yang ramah
- **Rounded** — semua elemen pakai sudut membulat, tidak ada yang kotak tajam
- **Spacious** — padding cukup lega, tidak sempit — nyaman untuk touch
- **Clear** — hierarki visual jelas, kasir tidak perlu berpikir lama
- **Consistent** — satu komponen = satu tampilan di seluruh halaman

---

## 2. Color Palette

### Brand Colors (Primary — Orange)

```
orange-50:  #FFF7ED   ← background ringan, hover state
orange-100: #FFEDD5   ← card accent, tag background
orange-200: #FED7AA   ← border accent
orange-300: #FDBA74   ← disabled state
orange-400: #FB923C   ← secondary button, icon accent
orange-500: #F97316   ← PRIMARY — tombol utama, link aktif
orange-600: #EA580C   ← hover primary button
orange-700: #C2410C   ← active/pressed state
```

### Neutral Colors

```
stone-50:   #FAFAF9   ← background halaman (page bg)
stone-100:  #F5F5F4   ← background card/sidebar
stone-200:  #E7E5E4   ← border default
stone-300:  #D6D3D1   ← border tegas, divider
stone-400:  #A8A29E   ← placeholder, icon muted
stone-500:  #78716C   ← text secondary
stone-700:  #44403C   ← text primary
stone-900:  #1C1917   ← text heading
```

### Semantic Colors

```
/* Success */
green-50:   #F0FDF4   ← background
green-500:  #22C55E   ← icon/border
green-700:  #15803D   ← text

/* Warning */
amber-50:   #FFFBEB
amber-500:  #F59E0B
amber-700:  #B45309

/* Danger */
red-50:     #FFF1F2
red-500:    #EF4444
red-700:    #B91C1C

/* Info */
sky-50:     #F0F9FF
sky-500:    #0EA5E9
sky-700:    #0369A1
```

### Background Layers

```
Layer 0 (page):    bg-stone-50    #FAFAF9
Layer 1 (card):    bg-white       #FFFFFF
Layer 2 (sidebar): bg-stone-100   #F5F5F4
Layer 3 (overlay): bg-white       #FFFFFF  (modal/dialog)
```

---

## 3. Typography

**Font Family:** Inter (Google Fonts)

```html
<!-- Tambahkan di index.html -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

```css
font-family: 'Inter', sans-serif;
```

### Type Scale

| Token       | Size  | Weight | Line Height | Penggunaan                        |
|-------------|-------|--------|-------------|-----------------------------------|
| `heading-xl`| 28px  | 700    | 1.2         | Judul halaman utama               |
| `heading-lg`| 22px  | 600    | 1.3         | Section heading, modal title      |
| `heading-md`| 18px  | 600    | 1.4         | Card title, sub-section           |
| `heading-sm`| 16px  | 600    | 1.4         | Label group, tabel header         |
| `body-lg`   | 16px  | 400    | 1.6         | Body text utama                   |
| `body-md`   | 14px  | 400    | 1.5         | Body text sekunder, deskripsi     |
| `body-sm`   | 13px  | 400    | 1.5         | Caption, helper text              |
| `label`     | 14px  | 500    | 1.4         | Form label, badge text            |
| `mono`      | 13px  | 400    | 1.5         | Invoice number, kode, harga       |

### Tailwind Mapping

```
heading-xl  → text-2xl font-bold
heading-lg  → text-xl font-semibold
heading-md  → text-lg font-semibold
heading-sm  → text-base font-semibold
body-lg     → text-base font-normal
body-md     → text-sm font-normal
body-sm     → text-[13px] font-normal
label       → text-sm font-medium
mono        → text-[13px] font-mono
```

---

## 4. Spacing System

Gunakan kelipatan **4px** (Tailwind default). Jangan gunakan nilai di luar sistem ini.

```
4px  = p-1, m-1    ← gap antar elemen micro
8px  = p-2, m-2    ← padding badge, gap icon-text
12px = p-3, m-3    ← padding compact
16px = p-4, m-4    ← padding default card
20px = p-5, m-5    ← padding section
24px = p-6, m-6    ← padding card lega
32px = p-8, m-8    ← padding halaman
40px = p-10, m-10  ← gap antar section besar
```

### Touch Target Minimum

Semua elemen interaktif (tombol, list item, checkbox) minimum **44px** tinggi.
Ini wajib untuk kenyamanan touch di tablet.

```
tombol kecil:  h-9  (36px) — hanya untuk aksi sekunder non-kritis
tombol normal: h-10 (40px) — minimum untuk touch
tombol besar:  h-12 (48px) — aksi utama di modul kasir
tombol POS:    h-14 (56px) — item produk di grid kasir
```

---

## 5. Border Radius

```
rounded-sm:  4px   ← badge kecil, chip
rounded-md:  6px   ← input, button kecil
rounded-lg:  8px   ← button default, card kecil
rounded-xl:  12px  ← card utama, modal
rounded-2xl: 16px  ← card hero, panel besar
rounded-full:       ← avatar, toggle, pill badge
```

**Aturan:** Semakin besar elemen, semakin besar radius-nya.
Jangan gunakan `rounded-none` kecuali untuk tabel.

---

## 6. Shadow System

```css
/* Gunakan class Tailwind ini */
shadow-none    ← elemen flat (badge, chip dalam card)
shadow-sm      ← card ringan di atas bg-stone-50
shadow-md      ← card aktif, dropdown
shadow-lg      ← modal, dialog
shadow-xl      ← sidebar floating (mobile)
```

Hindari `shadow-2xl` dan `shadow-inner` — terlalu dramatis untuk style soft & friendly.

---

## 7. Component Specifications

### 7.1 Button

```tsx
// Primary — aksi utama
<Button className="bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white rounded-lg h-10 px-4 font-medium">

// Secondary — aksi pendukung
<Button variant="outline" className="border-orange-200 text-orange-600 hover:bg-orange-50 rounded-lg h-10 px-4">

// Ghost — aksi tersier/navigasi
<Button variant="ghost" className="text-stone-600 hover:bg-stone-100 rounded-lg h-10 px-4">

// Danger — hapus/void
<Button className="bg-red-500 hover:bg-red-600 text-white rounded-lg h-10 px-4">

// POS Action — tombol besar di halaman kasir
<Button className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl h-14 px-6 text-base font-semibold">

// Disabled state (semua variant)
disabled:opacity-50 disabled:cursor-not-allowed
```

### 7.2 Card

```tsx
// Card default
<div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6">

// Card interactive (klik/hover)
<div className="bg-white rounded-xl shadow-sm border border-stone-200 p-6
     hover:shadow-md hover:border-orange-200 transition-all cursor-pointer">

// Card accent (highlighted/selected)
<div className="bg-orange-50 rounded-xl border border-orange-200 p-6">

// Card produk di POS grid
<div className="bg-white rounded-xl shadow-sm border border-stone-200 p-4
     hover:shadow-md hover:border-orange-300 hover:bg-orange-50/50
     active:scale-95 transition-all cursor-pointer select-none">
```

### 7.3 Input & Form

```tsx
// Input default (shadcn/ui)
<Input className="border-stone-300 rounded-lg h-10 focus:border-orange-400
      focus:ring-orange-400/20 placeholder:text-stone-400 bg-white">

// Input error
<Input className="border-red-400 focus:border-red-400 focus:ring-red-400/20">

// Label
<Label className="text-sm font-medium text-stone-700 mb-1.5">

// Helper text
<p className="text-[13px] text-stone-500 mt-1">

// Error text
<p className="text-[13px] text-red-600 mt-1">

// Form group spacing
<div className="space-y-5"> {/* antar field */}
<div className="space-y-1.5"> {/* label + input + helper */}
```

### 7.4 Badge / Tag

```tsx
// Status badges
const badgeStyles = {
  success:  "bg-green-50 text-green-700 border border-green-200",
  warning:  "bg-amber-50 text-amber-700 border border-amber-200",
  danger:   "bg-red-50 text-red-700 border border-red-200",
  info:     "bg-sky-50 text-sky-700 border border-sky-200",
  neutral:  "bg-stone-100 text-stone-600 border border-stone-200",
  primary:  "bg-orange-50 text-orange-700 border border-orange-200",
}

// Badge size
"text-[13px] font-medium px-2.5 py-0.5 rounded-full"  // small (default)
"text-sm font-medium px-3 py-1 rounded-full"            // medium
```

### 7.5 Table

```tsx
// Table wrapper
<div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm">

// Table header
<thead className="bg-stone-50 border-b border-stone-200">
<th className="text-left text-sm font-semibold text-stone-600 px-4 py-3">

// Table row
<tr className="border-b border-stone-100 hover:bg-stone-50/80 transition-colors">
<td className="px-4 py-3 text-sm text-stone-700">

// Table row selected
<tr className="bg-orange-50 border-b border-orange-100">
```

### 7.6 Sidebar

```tsx
// Sidebar container
<aside className="w-64 bg-stone-100 border-r border-stone-200 h-screen flex flex-col">

// Nav item default
<a className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-stone-600
   hover:bg-stone-200 hover:text-stone-900 transition-colors mx-2">

// Nav item active
<a className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-orange-500
   text-white font-medium mx-2">

// Nav icon size
<Icon className="w-5 h-5 flex-shrink-0">

// Section label
<p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider px-6 py-2 mt-4">
```

### 7.7 Modal / Dialog

```tsx
// Gunakan shadcn/ui Dialog
// Override styling:

// Overlay
"bg-black/40 backdrop-blur-sm"

// Content
"bg-white rounded-2xl shadow-xl border border-stone-200 p-6 max-w-md w-full"

// Title
"text-lg font-semibold text-stone-900"

// Description
"text-sm text-stone-500 mt-1"

// Footer (tombol)
"flex justify-end gap-3 mt-6"
```

### 7.8 Toast / Notification

```tsx
// Gunakan shadcn/ui Toast atau sonner

const toastStyles = {
  success: "bg-green-50 border-green-200 text-green-800",
  error:   "bg-red-50 border-red-200 text-red-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
  info:    "bg-sky-50 border-sky-200 text-sky-800",
}

// Position: bottom-right untuk desktop, bottom-center untuk tablet
```

---

## 8. Layout System

### 8.1 App Layout

```
┌─────────────────────────────────────────────────────┐
│  Sidebar (w-64, fixed)  │  Main Content Area         │
│                         │  ┌─────────────────────┐   │
│  Logo                   │  │ Page Header          │   │
│  ──────────             │  │ (title + actions)    │   │
│  Nav items              │  ├─────────────────────┤   │
│                         │  │                     │   │
│                         │  │ Page Content        │   │
│                         │  │                     │   │
│  ──────────             │  │                     │   │
│  User info              │  └─────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

```tsx
// Root layout
<div className="flex h-screen bg-stone-50 overflow-hidden">
  <Sidebar />  {/* w-64 flex-shrink-0 */}
  <main className="flex-1 overflow-auto">
    <PageHeader />
    <div className="p-6 md:p-8">
      {children}
    </div>
  </main>
</div>
```

### 8.2 POS Layout (Kasir)

```
┌────────────────────────────────────────────────────────┐
│  Header: nama cabang + kasir + jam                     │
├───────────────────────────┬────────────────────────────┤
│  Produk Grid (60%)        │  Cart Panel (40%)          │
│  ┌──────┐ ┌──────┐        │  ┌────────────────────┐   │
│  │      │ │      │        │  │ Item 1             │   │
│  │ Prod │ │ Prod │        │  │ Item 2             │   │
│  └──────┘ └──────┘        │  └────────────────────┘   │
│  Search bar di atas       │  Subtotal / diskon / total │
│                           │  Tombol BAYAR              │
└───────────────────────────┴────────────────────────────┘
```

```tsx
// POS layout (tidak pakai sidebar)
<div className="flex flex-col h-screen bg-stone-50">
  <POSHeader />
  <div className="flex flex-1 overflow-hidden gap-0">
    <ProductGrid className="flex-[6] overflow-auto p-4 bg-stone-50" />
    <CartPanel className="flex-[4] bg-white border-l border-stone-200 flex flex-col" />
  </div>
</div>
```

### 8.3 Grid System

```tsx
// Dashboard stats grid
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">

// Produk grid (POS)
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">

// Form 2 kolom
<div className="grid grid-cols-1 md:grid-cols-2 gap-5">

// Page content max width
<div className="max-w-7xl mx-auto">
```

---

## 9. Icon Usage (Lucide React)

```tsx
import { ShoppingCart, Package, ... } from 'lucide-react'

// Ukuran standar
size={16}  // icon di dalam text/badge
size={18}  // icon di tombol
size={20}  // icon di nav sidebar
size={24}  // icon dekoratif / header
size={32}  // icon besar / empty state

// Warna mengikuti parent (currentColor)
// Jangan hardcode warna icon kecuali semantic (misal: error = merah)
```

### Icon per Fitur

```
Dashboard:      LayoutDashboard
Kasir/POS:      ShoppingCart
Produk:         Package
Kategori:       Tag
Stok:           Boxes
Gudang:         Warehouse
Restok:         PackagePlus
Transaksi:      Receipt
Laporan:        BarChart3
Pelanggan:      Users
Cabang:         Store
Pengaturan:     Settings
User/Profile:   UserCircle
Login/Logout:   LogIn / LogOut
Hapus:          Trash2
Edit:           Pencil
Tambah:         Plus / PlusCircle
Cari:           Search
Filter:         SlidersHorizontal
Export:         Download
Tutup:          X
Kembali:        ArrowLeft
Notifikasi:     Bell
Low stock:      AlertTriangle
Success:        CheckCircle2
Error:          XCircle
Info:           Info
Cetak:          Printer
Barcode:        Barcode
Bayar:          CreditCard
```

---

## 10. Animation & Transition

```css
/* Default transition — gunakan untuk semua hover/focus */
transition-all duration-150 ease-in-out

/* Fade in — konten halaman */
transition-opacity duration-200

/* Scale press — tombol produk POS */
active:scale-95 transition-transform duration-100

/* Slide in — sidebar mobile, panel cart */
transition-transform duration-200 ease-out
```

Hindari animasi yang terlalu panjang (> 300ms) — kasir butuh respon cepat.
Jangan gunakan animasi bounce atau spring yang berlebihan.

---

## 11. Loading & Empty States

### Loading

```tsx
// Spinner inline (dalam tombol)
<Loader2 className="w-4 h-4 animate-spin" />

// Loading card skeleton
<div className="animate-pulse bg-stone-200 rounded-xl h-24 w-full" />

// Loading page
<div className="flex items-center justify-center h-64">
  <Loader2 className="w-8 h-8 animate-spin text-orange-400" />
</div>
```

### Empty State

```tsx
// Komponen empty state standar
<div className="flex flex-col items-center justify-center py-16 text-center">
  <div className="bg-stone-100 rounded-full p-4 mb-4">
    <Package className="w-8 h-8 text-stone-400" />
  </div>
  <p className="text-base font-medium text-stone-600 mb-1">Belum ada data</p>
  <p className="text-sm text-stone-400 mb-4">Keterangan singkat opsional</p>
  <Button className="bg-orange-500 ...">Tambah Sekarang</Button>
</div>
```

---

## 12. Responsive Breakpoints

Prioritas utama: **tablet (768px–1024px)**. Desktop adalah bonus.

```
sm:  640px   ← tablet portrait minimum
md:  768px   ← tablet target utama
lg:  1024px  ← tablet landscape / desktop kecil
xl:  1280px  ← desktop
```

### POS Module — Tablet First

Modul kasir dirancang untuk layar **768px × 1024px** (iPad / Android tablet).
Semua elemen harus bisa disentuh dengan jari, tanpa stylus.
Minimum touch target: **44px × 44px**.

---

## 13. Dos & Don'ts

### ✅ DO
- Gunakan warna dari palette di atas, tidak boleh hardcode hex baru
- Gunakan `rounded-lg` atau lebih untuk semua card & button
- Gunakan `shadow-sm` sebagai default shadow card
- Gunakan Inter di semua teks
- Berikan feedback visual langsung saat touch (active state)
- Gunakan skeleton loading, bukan spinner halaman penuh
- Gunakan `stone-*` untuk warna netral, bukan `gray-*`

### ❌ DON'T
- Jangan gunakan warna di luar palette yang didefinisikan
- Jangan gunakan `rounded-none` kecuali untuk tabel
- Jangan gunakan `shadow-2xl` — terlalu dramatis
- Jangan gunakan font selain Inter
- Jangan gunakan font-size di bawah 13px
- Jangan buat elemen touch target di bawah 44px
- Jangan gunakan warna `gray-*` (pakai `stone-*`)
- Jangan animasi > 300ms untuk aksi kasir

---

## 14. Tailwind Config

```ts
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',   // primary
          600: '#EA580C',
          700: '#C2410C',
        },
      },
      borderRadius: {
        DEFAULT: '8px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
```

---

## 15. shadcn/ui Setup

```bash
npx shadcn-ui@latest init
```

```json
// components.json
{
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/index.css",
    "baseColor": "stone",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

### Komponen yang wajib di-install

```bash
npx shadcn-ui@latest add button input label card
npx shadcn-ui@latest add dialog sheet dropdown-menu
npx shadcn-ui@latest add table badge separator
npx shadcn-ui@latest add toast select textarea
npx shadcn-ui@latest add skeleton avatar tooltip
```

### Override warna shadcn ke brand orange

Tambahkan di `src/index.css`:

```css
@layer base {
  :root {
    --primary: 24.6 95% 53.1%;           /* orange-500 */
    --primary-foreground: 0 0% 100%;
    --ring: 24.6 95% 53.1%;
    --background: 60 9% 98%;             /* stone-50 */
    --foreground: 20 14.3% 14.1%;        /* stone-900 */
    --muted: 60 4.8% 95.9%;              /* stone-100 */
    --muted-foreground: 25 5.3% 44.7%;   /* stone-500 */
    --border: 20 5.9% 90%;              /* stone-200 */
    --input: 20 5.9% 90%;
    --card: 0 0% 100%;
    --card-foreground: 20 14.3% 14.1%;
    --radius: 0.5rem;
  }
}
```

---

*Terakhir diperbarui: Juni 2026*
*Proyek: POS O-JERUK — PT Nano Indonesia Sakti*
