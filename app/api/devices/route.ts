import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { query, queryOne, execute } from "@/lib/db";
import crypto from "crypto";
import {
  ensureHttpUrl,
  normalizeInstagramUrl,
  normalizeFacebookUrl,
  normalizeTiktokUrl,
  normalizeWhatsAppUrl,
} from "@/lib/utils";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

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

  return NextResponse.json({ devices });
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const {
      businessName,
      existingBusinessId,
      mode = "DIRECT_REDIRECT",
      staticDestinationType = "google",
      customDestinationUrl,
      channels,
      managerEmail,
      managerName,
      managerPhone,
      googleReviewUrl: rawGoogle,
      facebook: rawFacebook,
      instagram: rawInstagram,
      website: rawWebsite,
      whatsapp: rawWhatsapp,
    } = body;

    if (!businessName && !existingBusinessId) {
      return NextResponse.json(
        { error: "Debe ingresar el nombre del negocio o seleccionar uno existente." },
        { status: 400 }
      );
    }

    // Extraer canales
    let googleReviewUrl = (rawGoogle || "").trim();
    let facebook = (rawFacebook || "").trim();
    let instagram = (rawInstagram || "").trim();
    let website = (rawWebsite || "").trim();
    let whatsapp = (rawWhatsapp || "").trim();
    let menuUrl = "";
    let googleMapsUrl = "";
    const customLinks: Array<{ id: string; type: string; title: string; value: string }> = [];

    if (Array.isArray(channels) && channels.length > 0) {
      for (const ch of channels) {
        const val = (ch.value || "").trim();
        if (!val) continue;
        if (ch.type === "google") googleReviewUrl = ensureHttpUrl(val);
        else if (ch.type === "facebook") facebook = normalizeFacebookUrl(val);
        else if (ch.type === "instagram") instagram = normalizeInstagramUrl(val);
        else if (ch.type === "website") website = ensureHttpUrl(val);
        else if (ch.type === "whatsapp") whatsapp = val;
        else if (ch.type === "menu") menuUrl = ensureHttpUrl(val);
        else if (ch.type === "maps") googleMapsUrl = ensureHttpUrl(val);
        else if (ch.type === "tiktok") {
          customLinks.push({
            id: ch.id,
            type: ch.type,
            title: ch.title || "TikTok",
            value: normalizeTiktokUrl(val),
          });
        } else {
          customLinks.push({
            id: ch.id,
            type: ch.type,
            title: ch.title || "Enlace",
            value: ensureHttpUrl(val),
          });
        }
      }
    } else {
      if (googleReviewUrl) googleReviewUrl = ensureHttpUrl(googleReviewUrl);
      if (facebook) facebook = normalizeFacebookUrl(facebook);
      if (instagram) instagram = normalizeInstagramUrl(instagram);
      if (website) website = ensureHttpUrl(website);
    }

    // 1. Obtener o crear el Negocio
    let business: any = null;
    if (existingBusinessId && existingBusinessId !== "new") {
      business = await queryOne(
        "SELECT * FROM businesses WHERE id = ? LIMIT 1",
        [existingBusinessId]
      );
      if (business) {
        await execute(
          `UPDATE businesses SET 
            googleReviewUrl = COALESCE(?, googleReviewUrl),
            facebook = COALESCE(?, facebook),
            instagram = COALESCE(?, instagram),
            website = COALESCE(?, website),
            whatsapp = COALESCE(?, whatsapp),
            updatedAt = NOW(3)
          WHERE id = ?`,
          [
            googleReviewUrl || null,
            facebook || null,
            instagram || null,
            website || null,
            whatsapp || null,
            business.id,
          ]
        );
        business = await queryOne("SELECT * FROM businesses WHERE id = ? LIMIT 1", [business.id]);
      }
    }

    if (!business) {
      const finalName = businessName.trim();
      const baseSlug =
        finalName
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "") || "negocio";

      const randomSuffix = Math.random().toString(36).substring(2, 6);
      const slug = `${baseSlug}-${randomSuffix}`;
      const businessId = crypto.randomUUID();

      await execute(
        `INSERT INTO businesses (id, userId, name, slug, category, googleReviewUrl, facebook, instagram, website, whatsapp, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
        [
          businessId,
          user.id,
          finalName,
          slug,
          "General",
          googleReviewUrl || null,
          facebook || null,
          instagram || null,
          website || null,
          whatsapp || null,
        ]
      );

      business = await queryOne("SELECT * FROM businesses WHERE id = ? LIMIT 1", [businessId]);
    }

    // 2. Generar Código Único para la Placa derivado del nombre del negocio
    const namePrefix =
      business.name
        .replace(/[^a-zA-Z0-9]/g, "")
        .slice(0, 4)
        .toUpperCase() || "ZL";
    const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    const plateCode = `ZL-${namePrefix}-${randomCode}`;
    const activationPin = Math.floor(1000 + Math.random() * 9000).toString();

    // 3. Determinar URL de destino si es modo Estático
    let finalDestinationUrl: string | null = null;
    if (mode === "DIRECT_REDIRECT") {
      if (customDestinationUrl) {
        finalDestinationUrl = ensureHttpUrl(customDestinationUrl);
      } else if (staticDestinationType === "google") {
        finalDestinationUrl = ensureHttpUrl(
          googleReviewUrl || business.googleReviewUrl || "https://search.google.com/local/writereview"
        );
      } else if (staticDestinationType === "facebook") {
        finalDestinationUrl = normalizeFacebookUrl(facebook || business.facebook || "https://facebook.com");
      } else if (staticDestinationType === "instagram") {
        const ig = instagram || business.instagram || "";
        finalDestinationUrl = normalizeInstagramUrl(ig);
      } else if (staticDestinationType === "website") {
        finalDestinationUrl = ensureHttpUrl(website || business.website || "https://google.com");
      } else if (staticDestinationType === "whatsapp") {
        const numOrUrl = whatsapp || business.whatsapp || "";
        finalDestinationUrl = normalizeWhatsAppUrl(numOrUrl);
      } else if (staticDestinationType === "menu") {
        finalDestinationUrl = ensureHttpUrl(menuUrl || "https://google.com");
      } else if (staticDestinationType === "maps") {
        finalDestinationUrl = ensureHttpUrl(googleMapsUrl || "https://maps.google.com");
      } else {
        // Buscar en customLinks si coincide
        const foundCl = customLinks.find((l) => l.id === staticDestinationType || l.title === staticDestinationType);
        if (foundCl) {
          finalDestinationUrl = ensureHttpUrl(foundCl.value);
        } else {
          // Destino por defecto: primer enlace disponible (Google Reviews preferente)
          if (googleReviewUrl || business.googleReviewUrl) {
            finalDestinationUrl = ensureHttpUrl(googleReviewUrl || business.googleReviewUrl);
          } else if (facebook || business.facebook) {
            finalDestinationUrl = normalizeFacebookUrl(facebook || business.facebook);
          } else if (instagram || business.instagram) {
            finalDestinationUrl = normalizeInstagramUrl(instagram || business.instagram);
          } else if (website || business.website) {
            finalDestinationUrl = ensureHttpUrl(website || business.website);
          } else if (whatsapp || business.whatsapp) {
            finalDestinationUrl = normalizeWhatsAppUrl(whatsapp || business.whatsapp);
          } else if (customLinks[0]?.value) {
            finalDestinationUrl = ensureHttpUrl(customLinks[0].value);
          } else {
            finalDestinationUrl = "https://search.google.com/local/writereview";
          }
        }
      }
    }

    // 4. Crear la Placa (Device) en MySQL
    const deviceId = crypto.randomUUID();
    const cleanMgrEmail = managerEmail ? managerEmail.trim() : null;
    const cleanMgrName = managerName ? managerName.trim() : null;
    const cleanMgrPhone = managerPhone ? managerPhone.trim() : null;

    await execute(
      `INSERT INTO devices (id, code, activationPin, status, mode, customDestinationUrl, businessId, managerEmail, managerName, managerPhone, createdAt, updatedAt)
       VALUES (?, ?, ?, 'ACTIVE', ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
      [deviceId, plateCode, activationPin, mode, finalDestinationUrl, business.id, cleanMgrEmail, cleanMgrName, cleanMgrPhone]
    );

    // Si se especificó correo del gerente, vincular/crear gerente y sucursal para alertas de reseñas
    if (cleanMgrEmail) {
      try {
        let mgr = await queryOne<any>("SELECT id FROM managers WHERE email = ? LIMIT 1", [cleanMgrEmail]);
        if (!mgr) {
          const mgrId = `mgr-${crypto.randomUUID()}`;
          const token = `mgrtok-${crypto.randomBytes(8).toString("hex")}`;
          await execute(
            `INSERT INTO managers (id, businessId, name, role, channel, whatsapp, email, accessToken, isActive, createdAt, updatedAt)
             VALUES (?, ?, ?, 'Gerente', 'BOTH', ?, ?, ?, 1, NOW(3), NOW(3))`,
            [mgrId, business.id, cleanMgrName || business.name, cleanMgrPhone || null, cleanMgrEmail, token]
          );
          mgr = { id: mgrId };
        }
        let branch = await queryOne<any>("SELECT id, managerId FROM branches WHERE businessId = ? LIMIT 1", [business.id]);
        if (!branch) {
          const brcId = `brc-${crypto.randomUUID()}`;
          await execute(
            `INSERT INTO branches (id, businessId, managerId, name, address, googleReviewUrl, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
            [brcId, business.id, mgr.id, `${business.name} - Principal`, business.address || null, googleReviewUrl || business.googleReviewUrl || null]
          );
        } else if (!branch.managerId) {
          await execute("UPDATE branches SET managerId = ? WHERE id = ?", [mgr.id, branch.id]);
        }
      } catch (mgrErr) {
        console.warn("No se pudo sincronizar entidad manager:", mgrErr);
      }
    }

    // Sincronizar en tabla qr_codes con tipo REVIEW_FILTER
    try {
      await execute(
        `INSERT INTO qr_codes (id, code, name, type, isDynamic, data, design, businessId, status, createdBy, createdAt, updatedAt)
         VALUES (?, ?, ?, 'REVIEW_FILTER', 1, ?, NULL, ?, 'ACTIVE', ?, NOW(3), NOW(3))
         ON DUPLICATE KEY UPDATE name = VALUES(name), data = VALUES(data), status = VALUES(status), updatedAt = NOW(3)`,
        [
          deviceId,
          plateCode,
          business.name,
          JSON.stringify({
            businessName: business.name,
            googleReviewUrl: finalDestinationUrl || googleReviewUrl || business.googleReviewUrl || "https://search.google.com/local/writereview",
            threshold: 3,
            managerEmail: cleanMgrEmail,
            managerName: cleanMgrName,
          }),
          business.id,
          user.id,
        ]
      );
    } catch (qrErr) {
      console.warn("No se pudo sincronizar qr_codes:", qrErr);
    }

    // 5. Crear el SmartProfile con los enlaces configurados
    const smartProfileId = crypto.randomUUID();
    const gReviewEnabled = Boolean(googleReviewUrl || business.googleReviewUrl) ? 1 : 0;
    const fbEnabled = Boolean(facebook || business.facebook) ? 1 : 0;
    const igEnabled = Boolean(instagram || business.instagram) ? 1 : 0;
    const webEnabled = Boolean(website || business.website) ? 1 : 0;
    const waEnabled = Boolean(whatsapp || business.whatsapp) ? 1 : 0;
    const mEnabled = Boolean(menuUrl) ? 1 : 0;
    const mapsEnabled = Boolean(googleMapsUrl) ? 1 : 0;

    await execute(
      `INSERT INTO smart_profiles (
        id, deviceId, title, description, theme, 
        googleReviewUrl, googleReviewEnabled,
        facebookUrl, facebookEnabled,
        instagramHandle, instagramEnabled,
        websiteUrl, websiteEnabled,
        whatsappNumber, whatsappEnabled,
        menuUrl, menuEnabled,
        googleMapsUrl, googleMapsEnabled,
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
      [
        smartProfileId,
        deviceId,
        business.name,
        "¡Gracias por visitarnos! Califica tu experiencia y conéctate con nuestras redes.",
        "dark_gold",
        googleReviewUrl || business.googleReviewUrl || null,
        gReviewEnabled,
        facebook || business.facebook || null,
        fbEnabled,
        instagram || business.instagram || null,
        igEnabled,
        website || business.website || null,
        webEnabled,
        whatsapp || business.whatsapp || null,
        waEnabled,
        menuUrl || null,
        mEnabled,
        googleMapsUrl || null,
        mapsEnabled,
      ]
    );

    // 6. Insertar customLinks en smart_links
    const createdCustomLinks: any[] = [];
    if (customLinks.length > 0) {
      for (let i = 0; i < customLinks.length; i++) {
        const cl = customLinks[i];
        if (cl.value && cl.value.trim()) {
          const linkId = crypto.randomUUID();
          const icon = cl.type === "tiktok" ? "music" : "globe";
          const val = cl.type === "tiktok" ? normalizeTiktokUrl(cl.value) : ensureHttpUrl(cl.value);
          await execute(
            `INSERT INTO smart_links (id, profileId, title, url, icon, \`order\`, isActive, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, 1, NOW(3), NOW(3))`,
            [linkId, smartProfileId, cl.title || "Enlace", val, icon, i]
          );
          createdCustomLinks.push({
            id: linkId,
            profileId: smartProfileId,
            title: cl.title,
            url: val,
            icon,
            order: i,
            isActive: 1,
          });
        }
      }
    }

    const fullDevice = {
      id: deviceId,
      code: plateCode,
      activationPin,
      status: "ACTIVE",
      mode,
      customDestinationUrl: finalDestinationUrl,
      businessId: business.id,
      business,
      smartProfile: {
        id: smartProfileId,
        title: business.name,
        description: "¡Gracias por visitarnos! Califica tu experiencia y conéctate con nuestras redes.",
        googleReviewUrl: googleReviewUrl || business.googleReviewUrl,
        googleReviewEnabled: Boolean(gReviewEnabled),
        facebookUrl: facebook || business.facebook,
        facebookEnabled: Boolean(fbEnabled),
        instagramHandle: instagram || business.instagram,
        instagramEnabled: Boolean(igEnabled),
        websiteUrl: website || business.website,
        websiteEnabled: Boolean(webEnabled),
        whatsappNumber: whatsapp || business.whatsapp,
        whatsappEnabled: Boolean(waEnabled),
        menuUrl: menuUrl || null,
        menuEnabled: Boolean(mEnabled),
        googleMapsUrl: googleMapsUrl || null,
        googleMapsEnabled: Boolean(mapsEnabled),
        customLinks: createdCustomLinks,
      },
      totalScans: 0,
      qrScans: 0,
      nfcScans: 0,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      device: fullDevice,
      qrUrl: `/r/${plateCode}?src=qr`,
      nfcUrl: `/r/${plateCode}?src=nfc`,
    });
  } catch (error: any) {
    console.error("Error creating device:", error);
    return NextResponse.json(
      { error: error.message || "Error al generar la placa en MySQL." },
      { status: 500 }
    );
  }
}
