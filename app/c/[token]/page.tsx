import CaseChat from "@/components/review/CaseChat";

export const dynamic = "force-dynamic";
export const metadata = { title: "Conversación con el gerente" };

export default function CustomerCasePage({ params }: { params: { token: string } }) {
  return (
    <div className="min-h-screen bg-[#f1f3f4] py-6 px-3">
      <div className="max-w-[520px] mx-auto">
        <CaseChat token={params.token} />
      </div>
    </div>
  );
}
