import CaseChat from "@/components/review/CaseChat";

export const dynamic = "force-dynamic";
export const metadata = { title: "Atención al cliente · Gerente", robots: { index: false } };

/** Enlace que recibe el gerente por WhatsApp/correo. No requiere login (token secreto). */
export default function ManagerCasePage({ params }: { params: { token: string } }) {
  return (
    <div className="min-h-screen bg-slate-200 py-6 px-3">
      <div className="max-w-[640px] mx-auto space-y-3">
        <div className="text-center text-sm text-slate-600">
          <b>Panel del gerente</b> · Responde al cliente antes de que publique su reseña. Tus mensajes le llegan en esta conversación
          {" "}(y por WhatsApp/correo si dejó contacto).
        </div>
        <CaseChat token={params.token} />
      </div>
    </div>
  );
}
