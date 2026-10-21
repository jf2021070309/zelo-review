import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { queryOne } from "@/lib/db";
import { ensureReviewSchema } from "@/lib/review-schema";
import { recordQrScan } from "@/lib/qr-scan";
import { loadReviewQr } from "@/lib/reviews";
import { buildWhatsAppUrl, withHttp } from "@/lib/qr-types";
import ReviewFlowClient from "@/components/review/ReviewFlowClient";
import QrLandingClient from "@/components/qr/QrLandingClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { code: string } }) {
  try {
    await ensureReviewSchema();
    const qr = await queryOne<any>("SELECT name, type, data FROM qr_codes WHERE code = ?", [params.code.toUpperCase()]);
    if (!qr) return { title: "ZELO" };
    const d = JSON.parse(qr.data || "{}");
    return { title: qr.type === "REVIEW_FILTER" ? `Califica tu visita · ${d.businessName || qr.name}` : d.title || qr.name };
  } catch {
    return { title: "ZELO" };
  }
}

export default async function QrResolverPage({ params }: { params: { code: string } }) {
  await ensureReviewSchema();
  const code = params.code.toUpperCase();
  const qr = await queryOne<any>("SELECT * FROM qr_codes WHERE code = ? LIMIT 1", [code]);
  if (!qr) notFound();

  if (qr.status !== "ACTIVE") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-700 p-6 text-center">
        <div>
          <div className="text-4xl mb-3">⏸️</div>
          <div className="text-lg font-semibold">Este código QR está pausado temporalmente</div>
        </div>
      </div>
    );
  }

  const h = headers();
  const ua = h.get("user-agent") || "";
  const ip = (h.get("x-forwarded-for") || "").split(",")[0].trim() || null;
  await recordQrScan(qr.id, ua, ip);

  let data: Record<string, any> = {};
  try {
    data = JSON.parse(qr.data || "{}");
  } catch {}
  let design: any = null;
  try {
    design = qr.design ? JSON.parse(qr.design) : null;
  } catch {}

  switch (qr.type) {
    case "LINK":
      redirect(withHttp(data.url));
    case "WHATSAPP":
      redirect(buildWhatsAppUrl(data.phone, data.message));
    case "APP": {
      const isIOS = /iPhone|iPad|iPod|Macintosh.*Mobile/i.test(ua);
      const isAndroid = /Android/i.test(ua);
      const target = (isIOS && data.iosUrl) || (isAndroid && data.androidUrl) || (!isIOS && !isAndroid && data.fallbackUrl);
      if (target) redirect(withHttp(target));
      break;
    }
    case "REVIEW_FILTER": {
      const ctx = await loadReviewQr(code);
      if (!ctx) notFound();
      return (
        <ReviewFlowClient
          code={code}
          businessName={ctx.businessName}
          branchName={ctx.branch?.name || null}
          branchAddress={ctx.branch?.address || null}
          question={data.question || "¿Cómo calificarías tu visita, del 1 al 5?"}
          threshold={ctx.threshold}
          logo={design?.logo || null}
        />
      );
    }
  }

  return <QrLandingClient code={code} type={qr.type} name={qr.name} data={data} accent={design?.frameColor || design?.fg || "#4f46e5"} />;
}
