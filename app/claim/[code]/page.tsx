import { prisma } from "@/lib/prisma";
import ClaimClient from "./ClaimClient";
import { getSession } from "@/lib/auth";

export default async function ClaimPage({
  params,
  searchParams,
}: {
  params: { code: string };
  searchParams: { notfound?: string };
}) {
  const code = params.code?.toUpperCase().trim();
  const session = await getSession();

  const device = await prisma.device.findUnique({
    where: { code },
    include: { business: true },
  });

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
