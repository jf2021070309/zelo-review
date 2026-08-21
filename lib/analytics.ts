import { UAParser } from "ua-parser-js";
import { prisma } from "./prisma";
import crypto from "crypto";

export interface ScanMetadata {
  deviceId: string;
  source: "QR" | "NFC" | "DIRECT" | "UNKNOWN";
  userAgent?: string;
  ip?: string;
}

export function hashIp(ip: string | undefined): string | null {
  if (!ip) return null;
  // Anonymize IP to comply with privacy best practices
  return crypto.createHash("sha256").update(ip + "zelo_salt").digest("hex").slice(0, 16);
}

export async function recordScanEvent(metadata: ScanMetadata) {
  try {
    const parser = new UAParser(metadata.userAgent || "");
    const browser = parser.getBrowser().name || "Unknown";
    const os = parser.getOS().name || "Unknown";
    const deviceType = parser.getDevice().type || (os === "iOS" || os === "Android" ? "mobile" : "desktop");

    const ipHash = hashIp(metadata.ip);

    await prisma.scanEvent.create({
      data: {
        deviceId: metadata.deviceId,
        source: metadata.source,
        ipHash: ipHash,
        userAgent: metadata.userAgent?.slice(0, 500),
        deviceType: deviceType,
        os: os,
        browser: browser,
      },
    });
  } catch (error) {
    console.error("Error recording scan event:", error);
    // Non-blocking: fail silently so redirect is never broken for visitors
  }
}
