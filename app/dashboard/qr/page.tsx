import QrStudioClient from "./QrStudioClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Generador QR | ZELO" };

export default function QrPage() {
  return <QrStudioClient />;
}
