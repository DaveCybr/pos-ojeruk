import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Branches
  const branch1 = await prisma.branch.upsert({
    where: { id: 'branch-jember-01' },
    update: {},
    create: { id: 'branch-jember-01', name: 'O-Jeruk Jember', address: 'Jl. Mastrip No. 1', city: 'Jember' },
  })
  const branch2 = await prisma.branch.upsert({
    where: { id: 'branch-surabaya-01' },
    update: {},
    create: { id: 'branch-surabaya-01', name: 'O-Jeruk Surabaya', address: 'Jl. Pemuda No. 10', city: 'Surabaya' },
  })

  // Admin
  await prisma.user.upsert({
    where: { email: 'admin@ojeruk.com' },
    update: {},
    create: {
      email: 'admin@ojeruk.com',
      name: 'Admin O-Jeruk',
      password: await bcrypt.hash('password', 12),
      role: 'ADMIN',
    },
  })

  // Warehouse
  await prisma.user.upsert({
    where: { email: 'gudang@ojeruk.com' },
    update: {},
    create: {
      email: 'gudang@ojeruk.com',
      name: 'Staff Gudang',
      password: await bcrypt.hash('password', 12),
      role: 'WAREHOUSE',
    },
  })

  // Cashiers
  await prisma.user.upsert({
    where: { email: 'kasir.jember@ojeruk.com' },
    update: {},
    create: {
      email: 'kasir.jember@ojeruk.com',
      name: 'Kasir Jember',
      password: await bcrypt.hash('password', 12),
      role: 'CASHIER',
      branchId: branch1.id,
    },
  })
  await prisma.user.upsert({
    where: { email: 'kasir.sby@ojeruk.com' },
    update: {},
    create: {
      email: 'kasir.sby@ojeruk.com',
      name: 'Kasir Surabaya',
      password: await bcrypt.hash('password', 12),
      role: 'CASHIER',
      branchId: branch2.id,
    },
  })

  // Categories
  const cat1 = await prisma.category.upsert({
    where: { id: 'cat-jeruk' },
    update: {},
    create: { id: 'cat-jeruk', name: 'Jeruk Segar', description: 'Berbagai jenis jeruk segar' },
  })
  const cat2 = await prisma.category.upsert({
    where: { id: 'cat-minuman' },
    update: {},
    create: { id: 'cat-minuman', name: 'Minuman Jeruk', description: 'Jus dan minuman berbahan jeruk' },
  })

  // Products
  const products = [
    { id: 'prod-001', name: 'Jeruk Pontianak', barcode: 'JRK001', categoryId: cat1.id, price: 25000, costPrice: 18000, unit: 'kg' },
    { id: 'prod-002', name: 'Jeruk Nipis', barcode: 'JRK002', categoryId: cat1.id, price: 15000, costPrice: 10000, unit: 'kg' },
    { id: 'prod-003', name: 'Jeruk Lemon', barcode: 'JRK003', categoryId: cat1.id, price: 35000, costPrice: 25000, unit: 'kg' },
    { id: 'prod-004', name: 'Jus Jeruk 350ml', barcode: 'MIN001', categoryId: cat2.id, price: 12000, costPrice: 7000, unit: 'cup' },
    { id: 'prod-005', name: 'Jus Jeruk 500ml', barcode: 'MIN002', categoryId: cat2.id, price: 18000, costPrice: 10000, unit: 'cup' },
  ]

  for (const p of products) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: {},
      create: { ...p, price: p.price, costPrice: p.costPrice },
    })
    // Stock per branch
    for (const branch of [branch1, branch2]) {
      await prisma.stock.upsert({
        where: { productId_branchId: { productId: p.id, branchId: branch.id } },
        update: {},
        create: { productId: p.id, branchId: branch.id, quantity: 50, minStock: 10 },
      })
    }
  }

  console.log('✅ Seeding completed!')
  console.log('📧 Login accounts:')
  console.log('   Admin     : admin@ojeruk.com / password')
  console.log('   Gudang    : gudang@ojeruk.com / password')
  console.log('   Kasir JBR : kasir.jember@ojeruk.com / password')
  console.log('   Kasir SBY : kasir.sby@ojeruk.com / password')
}

main().catch(console.error).finally(() => prisma.$disconnect())
