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
      googleReviewUrl,
      facebook,
      instagram,
      website,
      whatsapp,
      smartProfile,
    } = data;

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
        values.push(googleReviewUrl);
      }
      if (facebook !== undefined) {
        updates.push("facebook = ?");
        values.push(facebook);
      }
      if (instagram !== undefined) {
        updates.push("instagram = ?");
        values.push(instagram);
      }
      if (website !== undefined) {
        updates.push("website = ?");
        values.push(website);
      }
      if (whatsapp !== undefined) {
        updates.push("whatsapp = ?");
        values.push(whatsapp);
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

    // 2. Actualizar configuración central de la placa
    const deviceUpdates: string[] = [];
    const deviceValues: any[] = [];

    if (mode) {
      deviceUpdates.push("mode = ?");
      deviceValues.push(mode);
    }
    if (customDestinationUrl !== undefined) {
      deviceUpdates.push("customDestinationUrl = ?");
      deviceValues.push(customDestinationUrl);
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

    // 3. Upsert / Actualizar SmartProfile
    if (smartProfile || businessName || facebook !== undefined || instagram !== undefined || website !== undefined || whatsapp !== undefined || googleReviewUrl !== undefined) {
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
            updatedAt = NOW(3)
          WHERE id = ?`,
          [
            title || null,
            spData.description ?? null,
            gReview || null,
            spData.googleReviewEnabled !== undefined ? (spData.googleReviewEnabled ? 1 : 0) : null,
            fb || null,
            spData.facebookEnabled !== undefined ? (spData.facebookEnabled ? 1 : 0) : (fb ? 1 : null),
            wa || null,
            spData.whatsappEnabled !== undefined ? (spData.whatsappEnabled ? 1 : 0) : (wa ? 1 : null),
            ig || null,
            spData.instagramEnabled !== undefined ? (spData.instagramEnabled ? 1 : 0) : (ig ? 1 : null),
            web || null,
            spData.websiteEnabled !== undefined ? (spData.websiteEnabled ? 1 : 0) : (web ? 1 : null),
            existingProfile.id,
          ]
        );
      } else {
        const newSpId = crypto.randomUUID();
        await execute(
          `INSERT INTO smart_profiles (
            id, deviceId, title, description, theme,
            googleReviewUrl, googleReviewEnabled,
            facebookUrl, facebookEnabled,
            whatsappNumber, whatsappEnabled,
            instagramHandle, instagramEnabled,
            websiteUrl, websiteEnabled,
            createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, 'dark_gold', ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, NOW(3), NOW(3))`,
          [
            newSpId,
            params.id,
            title || "Mi Negocio",
            spData.description || "¡Gracias por visitarnos!",
            gReview || null,
            fb || null,
            fb ? 1 : 0,
            wa || null,
            wa ? 1 : 0,
            ig || null,
            ig ? 1 : 0,
            web || null,
            web ? 1 : 0,
          ]
        );
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
