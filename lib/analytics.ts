import { UAParser } from "ua-parser-js";
import { execute } from "./db";
import crypto from "crypto";

export interface ScanMetadata {
  deviceId: string;
  source: "QR" | "NFC" | "DIRECT" | "UNKNOWN";
  userAgent?: string;
  ip?: string;
}

export function hashIp(ip: string | undefined): string | null {
  if (!ip) return null;
  return crypto.createHash("sha256").update(ip + "zelo_salt").digest("hex").slice(0, 16);
}

export async function recordScanEvent(metadata: ScanMetadata) {
  try {
    const parser = new UAParser(metadata.userAgent || "");
    const browser = parser.getBrowser().name || "Unknown";
    const os = parser.getOS().name || "Unknown";
    const deviceType = parser.getDevice().type || (os === "iOS" || os === "Android" ? "mobile" : "desktop");

    const ipHash = hashIp(metadata.ip);
    const eventId = crypto.randomUUID();

    await execute(
      `INSERT INTO scan_events (id, deviceId, source, ipHash, userAgent, deviceType, os, browser, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(3))`,
      [
        eventId,
        metadata.deviceId,
        metadata.source,
        ipHash,
        metadata.userAgent?.slice(0, 500) || null,
        deviceType,
        os,
        browser,
      ]
    );
  } catch (error) {
    console.error("Error recording scan event:", error);
  }
}
