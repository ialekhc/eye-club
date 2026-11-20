import { PrismaClient, UserRole, ProductStatus, SaaSTier, VendorStatus } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('Demo seed is disabled in production.');
  const password = process.env.SEED_OWNER_PASSWORD || 'password123456';
  if (password.length < 12) throw new Error('Set SEED_OWNER_PASSWORD to at least 12 characters for a local demo seed.');

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

  console.log("Seeding Authentication Users...");
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@eye-club.local" },
    update: { passwordHash, role: UserRole.SUPER_ADMIN, isActive: true },
    create: {
      email: "admin@eye-club.local",
      firstName: "Admin",
      lastName: "User",
      passwordHash,
      role: UserRole.SUPER_ADMIN,
    },
  });

  const ownerUser = await prisma.user.upsert({
    where: { email: "owner@eye-club.local" },
    update: { passwordHash, role: UserRole.VENDOR_OWNER, isActive: true },
    create: {
      email: "owner@eye-club.local",
      firstName: "Aarav",
      lastName: "Sharma",
      passwordHash,
      role: UserRole.VENDOR_OWNER,
    },
  });

  const cashierUser = await prisma.user.upsert({
    where: { email: "cashier@eye-club.local" },
    update: { passwordHash, role: UserRole.CASHIER, isActive: true },
    create: {
      email: "cashier@eye-club.local",
      firstName: "Nisha",
      lastName: "Thapa",
      passwordHash,
      role: UserRole.CASHIER,
    },
  });

  const optometristUser = await prisma.user.upsert({
    where: { email: "optometrist@eye-club.local" },
    update: { passwordHash, role: UserRole.OPTOMETRIST, isActive: true },
    create: {
      email: "optometrist@eye-club.local",
      firstName: "Dr. Suman",
      lastName: "Karki",
      passwordHash,
      role: UserRole.OPTOMETRIST,
    },
  });

  await prisma.user.upsert({
    where: { email: "customer@eye-club.local" },
    update: { passwordHash, role: UserRole.CUSTOMER, isActive: true },
    create: {
      email: "customer@eye-club.local",
      firstName: "Kiran",
      lastName: "Bhandari",
      passwordHash,
      role: UserRole.CUSTOMER,
    },
  });

  if (await prisma.vendor.count()) {
    console.log('Existing vendor data found; authentication users refreshed.');
    return;
  }
  console.log("Seeding SaaS Vendors...");
  const vendorFlagship = await prisma.vendor.create({
    data: {
      id: "vendor-1",
      name: "Eye-Club Flagship Optics",
      slug: "eye-club-flagship",
      email: "ops@eye-club.local",
      phone: "+977-1-4220000",
      taxId: "PAN-609812345",
      address: "Durbar Marg, Kathmandu",
      brandColor: "#4f46e5",
      plan: SaaSTier.ENTERPRISE,
      status: VendorStatus.ACTIVE,
      commissionRate: 8.5,
      maxStores: 10,
      maxPosRegisters: 20,
    },
  });

  const vendorHimalayan = await prisma.vendor.create({
    data: {
      id: "vendor-2",
      name: "Himalayan Vision Clinic",
      slug: "himalayan-vision",
      email: "care@himalayanvision.np",
      phone: "+977-1-5541122",
      taxId: "PAN-304981122",
      address: "Jhamsikhel, Lalitpur",
      brandColor: "#0d9488",
      plan: SaaSTier.PROFESSIONAL,
      status: VendorStatus.ACTIVE,
      commissionRate: 10.0,
      maxStores: 5,
      maxPosRegisters: 8,
    },
  });

  console.log("Seeding Stores & POS Registers...");
  const store = await prisma.store.create({
    data: {
      id: "store-1",
      vendorId: vendorFlagship.id,
      name: "Eye-Club Durbar Marg",
      address: "Durbar Marg, Kathmandu, Nepal",
      phone: "+977-1-4220000",
      openingHours: "10:00 AM - 7:00 PM",
      services: ["Eye Checkup", "Frame Adjustment", "Contact Lens Fitting"]
    }
  });

  const storeLalitpur = await prisma.store.create({
    data: {
      id: "store-2",
      vendorId: vendorHimalayan.id,
      name: "Himalayan Vision Jhamsikhel",
      address: "Jhamsikhel Road, Lalitpur",
      phone: "+977-1-5541122",
      openingHours: "9:30 AM - 6:30 PM",
      services: ["Comprehensive Eye Exam", "Optical Dispensary"]
    }
  });

  await prisma.posRegister.createMany({
    data: [
      { id: "reg-1", vendorId: vendorFlagship.id, storeId: store.id, name: "Counter #1 - Main Optical" },
      { id: "reg-2", vendorId: vendorFlagship.id, storeId: store.id, name: "Counter #2 - Express Pickup" },
      { id: "reg-3", vendorId: vendorHimalayan.id, storeId: storeLalitpur.id, name: "Clinic Dispensary #1" },
    ]
  });

  console.log("Linking Seeded Staff Memberships...");
  for (const member of [
    { userId: adminUser.id, role: UserRole.VENDOR_OWNER },
    { userId: ownerUser.id, role: UserRole.VENDOR_OWNER },
    { userId: cashierUser.id, role: UserRole.CASHIER },
    { userId: optometristUser.id, role: UserRole.OPTOMETRIST },
  ]) {
    await prisma.vendorMember.upsert({
      where: {
        vendorId_userId: {
          vendorId: vendorFlagship.id,
          userId: member.userId,
        },
      },
      update: {
        storeId: store.id,
        role: member.role,
        isActive: true,
      },
      create: {
        vendorId: vendorFlagship.id,
        userId: member.userId,
        storeId: store.id,
        role: member.role,
      },
    });
  }

  console.log("Seeding Brands & Categories...");
  const brandRayban = await prisma.brand.create({ data: { name: "Ray-Ban", slug: "ray-ban", description: "Iconic eyewear brand." } });
  const brandEyeClub = await prisma.brand.create({ data: { name: "Eye-Club Air", slug: "eye-club-air", description: "Our ultra-light premium collection." } });
  
  const catEyeglasses = await prisma.category.create({ data: { name: "Eyeglasses", slug: "eyeglasses" } });
  const catSunglasses = await prisma.category.create({ data: { name: "Sunglasses", slug: "sunglasses" } });

  console.log("Seeding Products...");
  const p1 = await prisma.product.create({
    data: {
      vendorId: vendorFlagship.id,
      name: "Eye-Club Air 02",
      slug: "eye-club-air-02",
      skuBase: "EC-AIR02",
      brandId: brandEyeClub.id,
      categoryId: catEyeglasses.id,
      basePrice: 2799.00,
      status: ProductStatus.PUBLISHED,
      gender: "Unisex",
      frameShape: "Rectangle",
      frameType: "Full Rim",
      material: "TR90",
      frameWidth: 140,
      lensWidth: 52,
      lensHeight: 38,
      bridgeWidth: 18,
      templeLength: 145,
      weight: 12.5,
    }
  });

  await prisma.productVariant.create({
    data: {
      productId: p1.id,
      sku: "EC-AIR02-BLK-M",
      color: "Matte Black",
      size: "Medium",
      isActive: true,
      inventory: { create: { storeId: store.id, availableQuantity: 50, lowStockThreshold: 5 } },
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&q=80&w=800", altText: "Front view", isPrimary: true, displayOrder: 1 },
          { url: "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&q=80&w=800", altText: "Side view", isPrimary: false, displayOrder: 2 }
        ]
      }
    }
  });

  const p2 = await prisma.product.create({
    data: {
      vendorId: vendorFlagship.id,
      name: "Ray-Ban Aviator Classic",
      slug: "ray-ban-aviator-classic",
      skuBase: "RB-3025",
      brandId: brandRayban.id,
      categoryId: catSunglasses.id,
      basePrice: 15500.00,
      status: ProductStatus.PUBLISHED,
      gender: "Unisex",
      frameShape: "Aviator",
      frameType: "Full Rim",
      material: "Metal",
    }
  });

  await prisma.productVariant.create({
    data: {
      productId: p2.id,
      sku: "RB-3025-GLD-L",
      color: "Gold / Green",
      size: "Large",
      isActive: true,
      inventory: { create: { storeId: store.id, availableQuantity: 20, lowStockThreshold: 2 } },
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&q=80&w=800", altText: "Front view", isPrimary: true, displayOrder: 1 }
        ]
      }
    }
  });

  console.log("Seeding Lenses...");
  await prisma.lensType.create({
    data: {
      name: "Single Vision",
      description: "For distance or near vision",
      packages: {
        create: [
          {
            name: "Essential",
            price: 999,
            features: ["Anti-glare", "Scratch resistance"],
            index: 1.5,
            isRecommended: false
          },
          {
            name: "Comfort",
            price: 1999,
            features: ["Anti-glare", "Blue-light protection", "UV protection", "Scratch resistance"],
            index: 1.6,
            isRecommended: true
          },
          {
            name: "Premium",
            price: 3499,
            features: ["Thinner lens", "Premium coating", "UV protection", "Scratch resistance", "Blue-light protection"],
            index: 1.67,
            isRecommended: false
          }
        ]
      }
    }
  });

  console.log("Seed completed successfully! Login: admin@eye-club.local");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
