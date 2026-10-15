import { queryOne, query } from "@/lib/db";
import { notFound } from "next/navigation";
import SmartProfileClient from "./SmartProfileClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { code: string } }) {
  const code = params.code?.toUpperCase();
  const device = await queryOne<any>(
    `SELECT d.code, sp.title as spTitle, sp.description as spDescription, b.name as bName
     FROM devices d
     LEFT JOIN businesses b ON d.businessId = b.id
     LEFT JOIN smart_profiles sp ON sp.deviceId = d.id
     WHERE d.code = ?
     LIMIT 1`,
    [code]
  );

  if (!device) return { title: "ZELO Review" };

  const title = device.spTitle || device.bName || "ZELO Smart Plate";
  return {
    title: `${title} | ZELO Review`,
    description: device.spDescription || "Conecta con nosotros y déjanos tu reseña.",
  };
}

export default async function SmartProfilePage({
  params,
}: {
  params: { code: string };
}) {
  const code = params.code?.toUpperCase();

  const device = await queryOne<any>(
    `SELECT d.*, 
            b.name as b_name, b.logoUrl as b_logoUrl, b.coverUrl as b_coverUrl, 
            b.googleReviewUrl as b_googleReviewUrl, b.facebook as b_facebook, 
            b.instagram as b_instagram, b.website as b_website, b.whatsapp as b_whatsapp
     FROM devices d
     LEFT JOIN businesses b ON d.businessId = b.id
     WHERE d.code = ?
     LIMIT 1`,
    [code]
  );

  if (!device || !device.businessId) {
    notFound();
  }

  const profile = await queryOne<any>(
    "SELECT * FROM smart_profiles WHERE deviceId = ? LIMIT 1",
    [device.id]
  );

  const customLinks = profile
    ? await query<any>(
        "SELECT * FROM smart_links WHERE profileId = ? AND isActive = 1 ORDER BY `order` ASC",
        [profile.id]
      )
    : [];

  return (
    <SmartProfileClient
      deviceCode={device.code}
      businessName={device.b_name}
      logoUrl={device.b_logoUrl}
      coverUrl={device.b_coverUrl}
      profile={{
        title: profile?.title || device.b_name,
        description:
          profile?.description ||
          "¡Gracias por visitarnos! Tu opinión nos ayuda a crecer. Déjanos una reseña de 5 estrellas en Google.",
        theme: profile?.theme || "dark_gold",
        googleReviewUrl:
          profile?.googleReviewUrl ||
          device.b_googleReviewUrl ||
          "https://search.google.com/local/writereview",
        googleReviewEnabled: Boolean(profile?.googleReviewEnabled ?? true),
        facebookUrl: profile?.facebookUrl || device.b_facebook,
        facebookEnabled: Boolean(profile?.facebookEnabled ?? !!device.b_facebook),
        whatsappNumber: profile?.whatsappNumber || device.b_whatsapp,
        whatsappMessage: profile?.whatsappMessage || "¡Hola! Vengo desde su placa Zelo.",
        whatsappEnabled: Boolean(profile?.whatsappEnabled ?? !!device.b_whatsapp),
        instagramHandle: profile?.instagramHandle || device.b_instagram,
        instagramEnabled: Boolean(profile?.instagramEnabled ?? !!device.b_instagram),
        websiteUrl: profile?.websiteUrl || device.b_website,
        websiteEnabled: Boolean(profile?.websiteEnabled ?? !!device.b_website),
        menuUrl: profile?.menuUrl,
        menuEnabled: Boolean(profile?.menuEnabled ?? false),
        wifiSsid: profile?.wifiSsid,
        wifiPassword: profile?.wifiPassword,
        wifiEnabled: Boolean(profile?.wifiEnabled ?? false),
        googleMapsUrl: profile?.googleMapsUrl,
        googleMapsEnabled: Boolean(profile?.googleMapsEnabled ?? false),
        customLinks: customLinks || [],
      }}
    />
  );
}
