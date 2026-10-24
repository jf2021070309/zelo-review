import { getCurrentUser } from "@/lib/auth";
import { query } from "@/lib/db";
import { redirect } from "next/navigation";
import DashboardCrudClient from "./DashboardCrudClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Obtener negocios reales desde MySQL
  const businesses = await query(
    "SELECT id, name, slug, googleReviewUrl, facebook, instagram, website, whatsapp FROM businesses ORDER BY createdAt DESC"
  );

  // Obtener placas con su negocio, smart profile y conteo de métricas QR / NFC
  const devicesRows = await query(`
    SELECT 
      d.id, d.code, d.activationPin, d.status, d.mode, d.customDestinationUrl, d.businessId, d.createdAt,
      d.managerEmail, d.managerName, d.managerPhone,
      b.id AS b_id, b.name AS b_name, b.slug AS b_slug, b.googleReviewUrl AS b_googleReviewUrl,
      b.facebook AS b_facebook, b.instagram AS b_instagram, b.website AS b_website, b.whatsapp AS b_whatsapp,
      sp.id AS sp_id, sp.title AS sp_title, sp.description AS sp_description,
      sp.googleReviewUrl AS sp_googleReviewUrl, sp.googleReviewEnabled AS sp_googleReviewEnabled,
      sp.facebookUrl AS sp_facebookUrl, sp.facebookEnabled AS sp_facebookEnabled,
      sp.instagramHandle AS sp_instagramHandle, sp.instagramEnabled AS sp_instagramEnabled,
      sp.websiteUrl AS sp_websiteUrl, sp.websiteEnabled AS sp_websiteEnabled,
      sp.whatsappNumber AS sp_whatsappNumber, sp.whatsappEnabled AS sp_whatsappEnabled,
      sp.menuUrl AS sp_menuUrl, sp.menuEnabled AS sp_menuEnabled,
      sp.googleMapsUrl AS sp_googleMapsUrl, sp.googleMapsEnabled AS sp_googleMapsEnabled,
      COUNT(se.id) AS totalScans,
      SUM(CASE WHEN se.source = 'QR' THEN 1 ELSE 0 END) AS qrScans,
      SUM(CASE WHEN se.source = 'NFC' THEN 1 ELSE 0 END) AS nfcScans
    FROM devices d
    LEFT JOIN businesses b ON d.businessId = b.id
    LEFT JOIN smart_profiles sp ON sp.deviceId = d.id
    LEFT JOIN scan_events se ON se.deviceId = d.id
    GROUP BY d.id, b.id, sp.id
    ORDER BY d.createdAt DESC
  `);

  // Obtener enlaces personalizados de smart_links
  const allCustomLinks = await query<any>(
    "SELECT id, profileId, title, url, icon, `order`, isActive FROM smart_links WHERE isActive = 1 ORDER BY `order` ASC"
  );

  const devices = devicesRows.map((row: any) => ({
    id: row.id,
    code: row.code,
    activationPin: row.activationPin,
    status: row.status,
    mode: row.mode,
    customDestinationUrl: row.customDestinationUrl,
    businessId: row.businessId,
    managerEmail: row.managerEmail || null,
    managerName: row.managerName || null,
    managerPhone: row.managerPhone || null,
    business: row.b_id
      ? {
          id: row.b_id,
          name: row.b_name,
          slug: row.b_slug,
          googleReviewUrl: row.b_googleReviewUrl,
          facebook: row.b_facebook,
          instagram: row.b_instagram,
          website: row.b_website,
          whatsapp: row.b_whatsapp,
        }
      : null,
    smartProfile: row.sp_id
      ? {
          id: row.sp_id,
          title: row.sp_title,
          description: row.sp_description,
          googleReviewUrl: row.sp_googleReviewUrl,
          googleReviewEnabled: Boolean(row.sp_googleReviewEnabled),
          facebookUrl: row.sp_facebookUrl,
          facebookEnabled: Boolean(row.sp_facebookEnabled),
          instagramHandle: row.sp_instagramHandle,
          instagramEnabled: Boolean(row.sp_instagramEnabled),
          websiteUrl: row.sp_websiteUrl,
          websiteEnabled: Boolean(row.sp_websiteEnabled),
          whatsappNumber: row.sp_whatsappNumber,
          whatsappEnabled: Boolean(row.sp_whatsappEnabled),
          menuUrl: row.sp_menuUrl,
          menuEnabled: Boolean(row.sp_menuEnabled),
          googleMapsUrl: row.sp_googleMapsUrl,
          googleMapsEnabled: Boolean(row.sp_googleMapsEnabled),
          customLinks: allCustomLinks
            ? allCustomLinks.filter((l: any) => l.profileId === row.sp_id)
            : [],
        }
      : null,
    totalScans: Number(row.totalScans || 0),
    qrScans: Number(row.qrScans || 0),
    nfcScans: Number(row.nfcScans || 0),
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
  }));

  return (
    <DashboardCrudClient
      initialDevices={devices}
      businesses={businesses}
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }}
    />
  );
}
