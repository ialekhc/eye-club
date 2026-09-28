import { PrismaClient, UserRole, ProductStatus } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning database...");
  await prisma.inventory.deleteMany();
  await prisma.store.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.lensPackage.deleteMany();
  await prisma.lensType.deleteMany();

  console.log("Seeding Store...");
  const store = await prisma.store.create({
    data: {
      id: "store-1",
      name: "Eye-Club Kathmandu",
      address: "Durbar Marg, Kathmandu, Nepal",
      phone: "+977-1-4220000",
      openingHours: "10:00 AM - 7:00 PM",
      services: ["Eye Checkup", "Frame Adjustment"]
    }
  });

  console.log("Seeding Admin User...");
  const passwordHash = await argon2.hash("password123", { type: argon2.argon2id });
  await prisma.user.upsert({
    where: { email: "admin@eye-club.local" },
    update: { passwordHash, role: UserRole.SUPER_ADMIN },
    create: {
      email: "admin@eye-club.local",
      firstName: "Admin",
      lastName: "User",
      passwordHash,
      role: UserRole.SUPER_ADMIN,
    },
  });

  console.log("Seeding Brands & Categories...");
  const brandRayban = await prisma.brand.create({ data: { name: "Ray-Ban", slug: "ray-ban", description: "Iconic eyewear brand." } });
  const brandEyeClub = await prisma.brand.create({ data: { name: "Eye-Club Air", slug: "eye-club-air", description: "Our ultra-light premium collection." } });
  
  const catEyeglasses = await prisma.category.create({ data: { name: "Eyeglasses", slug: "eyeglasses" } });
  const catSunglasses = await prisma.category.create({ data: { name: "Sunglasses", slug: "sunglasses" } });

  console.log("Seeding Products...");
  const p1 = await prisma.product.create({
    data: {
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

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
