import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import SmartProfileClient from "./SmartProfileClient";

export async function generateMetadata({ params }: { params: { code: string } }) {
  const code = params.code?.toUpperCase();
  const device = await prisma.device.findUnique({
    where: { code },
    include: { business: true, smartProfile: true },
  });

  if (!device) return { title: "ZELO Review" };

  const title = device.smartProfile?.title || device.business?.name || "ZELO Smart Plate";
  return {
    title: `${title} | ZELO Review`,
    description: device.smartProfile?.description || "Conecta con nosotros y déjanos tu reseña.",
  };
}

export default async function SmartProfilePage({
  params,
}: {
  params: { code: string };
}) {
  const code = params.code?.toUpperCase();

  const device = await prisma.device.findUnique({
    where: { code },
    include: {
      business: true,
      smartProfile: {
        include: {
          customLinks: {
            where: { isActive: true },
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!device || !device.business) {
    notFound();
  }

  const profile = device.smartProfile;
  const business = device.business;

  return (
    <SmartProfileClient
      deviceCode={device.code}
      businessName={business.name}
      logoUrl={business.logoUrl}
      coverUrl={business.coverUrl}
      profile={{
        title: profile?.title || business.name,
        description:
          profile?.description ||
          "¡Gracias por visitarnos! Tu opinión nos ayuda a crecer. Déjanos una reseña de 5 estrellas en Google.",
        theme: profile?.theme || "dark_gold",
        googleReviewUrl:
          profile?.googleReviewUrl ||
          business.googleReviewUrl ||
          "https://search.google.com/local/writereview",
        googleReviewEnabled: profile?.googleReviewEnabled ?? true,
        whatsappNumber: profile?.whatsappNumber || business.whatsapp,
        whatsappMessage: profile?.whatsappMessage || "¡Hola! Vengo desde su placa Zelo.",
        whatsappEnabled: profile?.whatsappEnabled ?? !!business.whatsapp,
        instagramHandle: profile?.instagramHandle || business.instagram,
        instagramEnabled: profile?.instagramEnabled ?? !!business.instagram,
        websiteUrl: profile?.websiteUrl || business.website,
        websiteEnabled: profile?.websiteEnabled ?? !!business.website,
        menuUrl: profile?.menuUrl,
        menuEnabled: profile?.menuEnabled ?? false,
        wifiSsid: profile?.wifiSsid,
        wifiPassword: profile?.wifiPassword,
        wifiEnabled: profile?.wifiEnabled ?? false,
        googleMapsUrl: profile?.googleMapsUrl,
        googleMapsEnabled: profile?.googleMapsEnabled ?? false,
        customLinks: profile?.customLinks || [],
      }}
    />
  );
}
