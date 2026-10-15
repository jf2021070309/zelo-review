import { queryOne } from "@/lib/db";
import ClaimClient from "./ClaimClient";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ClaimPage({
  params,
  searchParams,
}: {
  params: { code: string };
  searchParams: { notfound?: string };
}) {
  const code = params.code?.toUpperCase().trim();
  const session = await getSession();

  const device = await queryOne<any>(
    "SELECT id, code, status, businessId FROM devices WHERE code = ? LIMIT 1",
    [code]
  );

  return (
    <ClaimClient
      initialCode={code}
      deviceExists={!!device}
      isAlreadyActive={device?.status === "ACTIVE" && !!device.businessId}
      isLoggedIn={!!session}
      userEmail={session?.email}
    />
  );
}
