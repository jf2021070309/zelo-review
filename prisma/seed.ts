import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando Seeding de ZELO Review...");

  const adminPassword = await bcrypt.hash("admin123456", 10);
  const demoPassword = await bcrypt.hash("demo123456", 10);

  // 1. Super Admin User
  const admin = await prisma.user.upsert({
    where: { email: "admin@zelo.pe" },
    update: {},
    create: {
      email: "admin@zelo.pe",
      name: "Administrador Zelo",
      password: adminPassword,
      role: "ADMIN",
    },
  });
  console.log("👤 Admin creado:", admin.email);

  // 2. Demo Business User
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@zelo.pe" },
    update: {},
    create: {
      email: "demo@zelo.pe",
      name: "Carlos Mendoza",
      password: demoPassword,
      role: "BUSINESS_OWNER",
    },
  });
  console.log("👤 Usuario Demo creado:", demoUser.email);

  // 3. Demo Business
  const business = await prisma.business.upsert({
    where: { slug: "fuego-criollo-restobar" },
    update: {},
    create: {
      userId: demoUser.id,
      name: "Fuego Criollo Resto-Bar",
      slug: "fuego-criollo-restobar",
      category: "Restaurante & Bar",
      googleReviewUrl: "https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4",
      phone: "+51 987 654 321",
      whatsapp: "51987654321",
      instagram: "fuegocriollo.pe",
      website: "https://fuegocriollo.pe",
      address: "Av. La Marina 2450, San Miguel, Lima",
    },
  });
  console.log("🏢 Negocio Demo creado:", business.name);

  // 4. Batch de Producción
  const batch = await prisma.batch.create({
    data: {
      name: "Lote UV-01 - 50 Placas Acrílicas Zelo",
      quantity: 50,
      prefix: "ZL",
      notes: "Producción inicial acrílico negro 10x15cm con acabado brillante y grabado láser",
    },
  });

  // 5. Device 1: Direct Google Review Redirect
  const device1 = await prisma.device.upsert({
    where: { code: "ZL-DEMO01" },
    update: {},
    create: {
      code: "ZL-DEMO01",
      activationPin: "1234",
      status: "ACTIVE",
      mode: "DIRECT_REDIRECT",
      businessId: business.id,
      batchId: batch.id,
    },
  });

  // 6. Device 2: Smart Profile Hub
  const device2 = await prisma.device.upsert({
    where: { code: "ZL-DEMO02" },
    update: {},
    create: {
      code: "ZL-DEMO02",
      activationPin: "5678",
      status: "ACTIVE",
      mode: "SMART_PROFILE",
      businessId: business.id,
      batchId: batch.id,
      smartProfile: {
        create: {
          title: "Fuego Criollo Resto-Bar",
          description: "¡Gracias por visitarnos! Califica tu experiencia y déjanos tu reseña en Google para seguir mejorando.",
          theme: "dark_gold",
          googleReviewUrl: "https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4",
          googleReviewEnabled: true,
          whatsappNumber: "51987654321",
          whatsappMessage: "¡Hola! Quisiera reservar una mesa en Fuego Criollo.",
          whatsappEnabled: true,
          instagramHandle: "fuegocriollo.pe",
          instagramEnabled: true,
          websiteUrl: "https://fuegocriollo.pe",
          websiteEnabled: true,
          menuUrl: "https://fuegocriollo.pe/carta-digital.pdf",
          menuEnabled: true,
          wifiSsid: "FuegoCriollo_Clientes",
          wifiPassword: "carnesybrasas2026",
          wifiEnabled: true,
          googleMapsUrl: "https://maps.google.com",
          googleMapsEnabled: true,
          customLinks: {
            create: [
              {
                title: "🎁 Reclama tu Pisco Sour de Cortesía",
                url: "https://fuegocriollo.pe/promociones",
                icon: "gift",
                order: 1,
              },
              {
                title: "🎵 Mira nuestra playlist en Spotify",
                url: "https://spotify.com",
                icon: "globe",
                order: 2,
              },
            ],
          },
        },
      },
    },
  });

  // 7. Device 3: Unclaimed / Factory Ready Device
  await prisma.device.upsert({
    where: { code: "ZL-UNCLAIMED" },
    update: {},
    create: {
      code: "ZL-UNCLAIMED",
      activationPin: "8492",
      status: "READY_TO_ASSIGN",
      batchId: batch.id,
    },
  });

  console.log("📱 Placas creadas: ZL-DEMO01 (Direct), ZL-DEMO02 (Smart Hub), ZL-UNCLAIMED (Sin activar)");

  // 8. Generate sample scan events for realistic charts
  const sources = ["QR", "NFC"] as const;
  const osList = ["iOS", "Android", "Windows", "macOS"];
  const browserList = ["Safari", "Chrome", "Firefox", "Edge"];

  const now = new Date();
  for (let i = 0; i < 60; i++) {
    const daysAgo = Math.floor(Math.random() * 14);
    const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000 - Math.random() * 86400000);
    const source = sources[Math.random() > 0.4 ? 0 : 1]; // 60% QR, 40% NFC

    await prisma.scanEvent.create({
      data: {
        deviceId: Math.random() > 0.3 ? device1.id : device2.id,
        source: source,
        deviceType: "mobile",
        os: osList[Math.random() > 0.5 ? 0 : 1],
        browser: browserList[Math.random() > 0.5 ? 0 : 1],
        createdAt: date,
      },
    });
  }

  console.log("📊 60 eventos de escaneo de prueba registrados.");
  console.log("✅ Seed completado con éxito.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
