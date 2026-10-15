import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { queryOne, execute, query } from "@/lib/db";
import crypto from "crypto";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const device = await queryOne<any>(
    "SELECT * FROM devices WHERE id = ? LIMIT 1",
    [params.id]
  );

  if (!device) {
    return NextResponse.json({ error: "Placa no encontrada" }, { status: 404 });
  }

  const business = device.businessId
    ? await queryOne("SELECT * FROM businesses WHERE id = ? LIMIT 1", [device.businessId])
    : null;

  const smartProfile = await queryOne(
    "SELECT * FROM smart_profiles WHERE deviceId = ? LIMIT 1",
    [device.id]
  );

  const customLinks = smartProfile
    ? await query("SELECT * FROM smart_links WHERE profileId = ? ORDER BY `order` ASC", [smartProfile.id])
    : [];

  const scanEvents = await query(
    "SELECT * FROM scan_events WHERE deviceId = ? ORDER BY createdAt DESC LIMIT 50",
    [device.id]
  );

  return NextResponse.json({
    device: {
      ...device,
      business,
      smartProfile: smartProfile ? { ...smartProfile, customLinks } : null,
      scanEvents,
    },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const device = await queryOne<any>(
      "SELECT * FROM devices WHERE id = ? LIMIT 1",
      [params.id]
    );

    if (!device) {
      return NextResponse.json({ error: "Placa no encontrada" }, { status: 404 });
    }

    const data = await request.json();
    const {
      mode,
      customDestinationUrl,
      status,
      businessName,
      channels,
      googleReviewUrl: rawGoogle,
      facebook: rawFacebook,
      instagram: rawInstagram,
      website: rawWebsite,
      whatsapp: rawWhatsapp,
      smartProfile,
    } = data;

    // Extraer canales si vienen en payload
    let googleReviewUrl = rawGoogle;
    let facebook = rawFacebook;
    let instagram = rawInstagram;
    let website = rawWebsite;
    let whatsapp = rawWhatsapp;
    let menuUrl: string | undefined = undefined;
    let googleMapsUrl: string | undefined = undefined;
    let customLinks: Array<{ id: string; type: string; title: string; value: string }> | null = null;

    if (Array.isArray(channels)) {
      customLinks = [];
      googleReviewUrl = "";
      facebook = "";
      instagram = "";
      website = "";
      whatsapp = "";
      menuUrl = "";
      googleMapsUrl = "";

      for (const ch of channels) {
        const val = (ch.value || "").trim();
        if (!val) continue;
        if (ch.type === "google") googleReviewUrl = val;
        else if (ch.type === "facebook") facebook = val;
        else if (ch.type === "instagram") instagram = val;
        else if (ch.type === "website") website = val;
        else if (ch.type === "whatsapp") whatsapp = val;
        else if (ch.type === "menu") menuUrl = val;
        else if (ch.type === "maps") googleMapsUrl = val;
        else {
          customLinks.push({
            id: ch.id,
            type: ch.type,
            title: ch.title || "Enlace",
            value: val,
          });
        }
      }
    }

    // 1. Actualizar negocio si se envió cambio de nombre o enlaces
    if (device.businessId) {
      const updates: string[] = [];
      const values: any[] = [];

      if (businessName) {
        updates.push("name = ?");
        values.push(businessName);
      }
      if (googleReviewUrl !== undefined) {
        updates.push("googleReviewUrl = ?");
        values.push(googleReviewUrl || null);
      }
      if (facebook !== undefined) {
        updates.push("facebook = ?");
        values.push(facebook || null);
      }
      if (instagram !== undefined) {
        updates.push("instagram = ?");
        values.push(instagram || null);
      }
      if (website !== undefined) {
        updates.push("website = ?");
        values.push(website || null);
      }
      if (whatsapp !== undefined) {
        updates.push("whatsapp = ?");
        values.push(whatsapp || null);
      }

      if (updates.length > 0) {
        updates.push("updatedAt = NOW(3)");
        values.push(device.businessId);
        await execute(
          `UPDATE businesses SET ${updates.join(", ")} WHERE id = ?`,
          values
        );
      }
    }

    // 2. Determinar destino si es modo directo
    let finalCustomDestination = customDestinationUrl;
    if (mode === "DIRECT_REDIRECT" && !finalCustomDestination) {
      if (googleReviewUrl) finalCustomDestination = googleReviewUrl;
      else if (facebook) finalCustomDestination = facebook;
      else if (instagram) finalCustomDestination = instagram.startsWith("http") ? instagram : `https://instagram.com/${instagram.replace("@", "")}`;
      else if (website) finalCustomDestination = website;
      else if (whatsapp) finalCustomDestination = `https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}`;
      else if (menuUrl) finalCustomDestination = menuUrl;
      else if (googleMapsUrl) finalCustomDestination = googleMapsUrl;
      else if (customLinks && customLinks.length > 0) finalCustomDestination = customLinks[0].value;
    }

    // 3. Actualizar configuración central de la placa
    const deviceUpdates: string[] = [];
    const deviceValues: any[] = [];

    if (mode) {
      deviceUpdates.push("mode = ?");
      deviceValues.push(mode);
    }
    if (finalCustomDestination !== undefined) {
      deviceUpdates.push("customDestinationUrl = ?");
      deviceValues.push(finalCustomDestination || null);
    }
    if (status) {
      deviceUpdates.push("status = ?");
      deviceValues.push(status);
    }

    if (deviceUpdates.length > 0) {
      deviceUpdates.push("updatedAt = NOW(3)");
      deviceValues.push(params.id);
      await execute(
        `UPDATE devices SET ${deviceUpdates.join(", ")} WHERE id = ?`,
        deviceValues
      );
    }

    // 4. Upsert / Actualizar SmartProfile
    if (
      smartProfile ||
      businessName ||
      facebook !== undefined ||
      instagram !== undefined ||
      website !== undefined ||
      whatsapp !== undefined ||
      googleReviewUrl !== undefined ||
      menuUrl !== undefined ||
      googleMapsUrl !== undefined ||
      customLinks !== null
    ) {
      const existingProfile = await queryOne<any>(
        "SELECT id FROM smart_profiles WHERE deviceId = ? LIMIT 1",
        [params.id]
      );

      const spData = smartProfile || {};
      const title = spData.title || businessName || undefined;
      const gReview = spData.googleReviewUrl !== undefined ? spData.googleReviewUrl : googleReviewUrl;
      const fb = spData.facebookUrl !== undefined ? spData.facebookUrl : facebook;
      const ig = spData.instagramHandle !== undefined ? spData.instagramHandle : instagram;
      const web = spData.websiteUrl !== undefined ? spData.websiteUrl : website;
      const wa = spData.whatsappNumber !== undefined ? spData.whatsappNumber : whatsapp;
      const mUrl = spData.menuUrl !== undefined ? spData.menuUrl : menuUrl;
      const mapsUrl = spData.googleMapsUrl !== undefined ? spData.googleMapsUrl : googleMapsUrl;

      let targetProfileId = existingProfile?.id;

      if (existingProfile) {
        await execute(
          `UPDATE smart_profiles SET
            title = COALESCE(?, title),
            description = COALESCE(?, description),
            googleReviewUrl = COALESCE(?, googleReviewUrl),
            googleReviewEnabled = COALESCE(?, googleReviewEnabled),
            facebookUrl = COALESCE(?, facebookUrl),
            facebookEnabled = COALESCE(?, facebookEnabled),
            whatsappNumber = COALESCE(?, whatsappNumber),
            whatsappEnabled = COALESCE(?, whatsappEnabled),
            instagramHandle = COALESCE(?, instagramHandle),
            instagramEnabled = COALESCE(?, instagramEnabled),
            websiteUrl = COALESCE(?, websiteUrl),
            websiteEnabled = COALESCE(?, websiteEnabled),
            menuUrl = COALESCE(?, menuUrl),
            menuEnabled = COALESCE(?, menuEnabled),
            googleMapsUrl = COALESCE(?, googleMapsUrl),
            googleMapsEnabled = COALESCE(?, googleMapsEnabled),
            updatedAt = NOW(3)
          WHERE id = ?`,
          [
            title || null,
            spData.description ?? null,
            gReview !== undefined ? (gReview || null) : null,
            gReview !== undefined ? (gReview ? 1 : 0) : null,
            fb !== undefined ? (fb || null) : null,
            fb !== undefined ? (fb ? 1 : 0) : null,
            wa !== undefined ? (wa || null) : null,
            wa !== undefined ? (wa ? 1 : 0) : null,
            ig !== undefined ? (ig || null) : null,
            ig !== undefined ? (ig ? 1 : 0) : null,
            web !== undefined ? (web || null) : null,
            web !== undefined ? (web ? 1 : 0) : null,
            mUrl !== undefined ? (mUrl || null) : null,
            mUrl !== undefined ? (mUrl ? 1 : 0) : null,
            mapsUrl !== undefined ? (mapsUrl || null) : null,
            mapsUrl !== undefined ? (mapsUrl ? 1 : 0) : null,
            existingProfile.id,
          ]
        );
      } else {
        targetProfileId = crypto.randomUUID();
        await execute(
          `INSERT INTO smart_profiles (
            id, deviceId, title, description, theme,
            googleReviewUrl, googleReviewEnabled,
            facebookUrl, facebookEnabled,
            whatsappNumber, whatsappEnabled,
            instagramHandle, instagramEnabled,
            websiteUrl, websiteEnabled,
            menuUrl, menuEnabled,
            googleMapsUrl, googleMapsEnabled,
            createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, 'dark_gold', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
          [
            targetProfileId,
            params.id,
            title || "Mi Negocio",
            spData.description || "¡Gracias por visitarnos!",
            gReview || null,
            gReview ? 1 : 0,
            fb || null,
            fb ? 1 : 0,
            wa || null,
            wa ? 1 : 0,
            ig || null,
            ig ? 1 : 0,
            web || null,
            web ? 1 : 0,
            mUrl || null,
            mUrl ? 1 : 0,
            mapsUrl || null,
            mapsUrl ? 1 : 0,
          ]
        );
      }

      // Actualizar smart_links si se enviaron customLinks
      if (customLinks !== null && targetProfileId) {
        await execute("DELETE FROM smart_links WHERE profileId = ?", [targetProfileId]);
        for (let i = 0; i < customLinks.length; i++) {
          const cl = customLinks[i];
          if (cl.value && cl.value.trim()) {
            const linkId = crypto.randomUUID();
            const icon = cl.type === "tiktok" ? "music" : "globe";
            await execute(
              `INSERT INTO smart_links (id, profileId, title, url, icon, \`order\`, isActive, createdAt, updatedAt)
               VALUES (?, ?, ?, ?, ?, ?, 1, NOW(3), NOW(3))`,
              [linkId, targetProfileId, cl.title || "Enlace", cl.value.trim(), icon, i]
            );
          }
        }
      }
    }

    const updatedDevice = await queryOne("SELECT * FROM devices WHERE id = ? LIMIT 1", [params.id]);

    return NextResponse.json({ success: true, device: updatedDevice });
  } catch (error: any) {
    console.error("Device update error:", error);
    return NextResponse.json(
      { error: error.message || "Error al actualizar la configuración." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const device = await queryOne<any>(
      "SELECT id FROM devices WHERE id = ? LIMIT 1",
      [params.id]
    );

    if (!device) {
      return NextResponse.json({ error: "Placa no encontrada" }, { status: 404 });
    }

    await execute("DELETE FROM devices WHERE id = ?", [params.id]);

    return NextResponse.json({ success: true, message: "Placa eliminada correctamente de MySQL." });
  } catch (error: any) {
    console.error("Device delete error:", error);
    return NextResponse.json(
      { error: error.message || "Error al eliminar la placa." },
      { status: 500 }
    );
  }
}
