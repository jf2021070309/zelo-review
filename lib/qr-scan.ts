import crypto from "crypto";
import { UAParser } from "ua-parser-js";
import { execute } from "./db";
import { hashIp } from "./analytics";

export async function recordQrScan(qrId: string, userAgent?: string | null, ip?: string | null) {
  try {
    const p = new UAParser(userAgent || "");
    const os = p.getOS().name || "Unknown";
    await execute(
      "INSERT INTO qr_scans (id, qrId, ipHash, os, browser, deviceType, createdAt) VALUES (?, ?, ?, ?, ?, ?, NOW(3))",
      [crypto.randomUUID(), qrId, hashIp(ip || undefined), os, p.getBrowser().name || "Unknown", p.getDevice().type || (os === "iOS" || os === "Android" ? "mobile" : "desktop")]
    );
  } catch (e) {
    console.error("recordQrScan", e);
  }
}
