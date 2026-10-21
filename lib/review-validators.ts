import { queryOne } from "./db";
import { str } from "./api-helpers";
import { HttpError } from "./reviews";

export function validateManager(body: any) {
  const name = str(body.name, 191);
  const channel = ["WHATSAPP", "EMAIL", "BOTH"].includes(body.channel) ? body.channel : "WHATSAPP";
  const whatsapp = str(body.whatsapp, 50)?.replace(/[^0-9+]/g, "") || null;
  const email = str(body.email, 191);
  if (!name) throw new HttpError(400, "El nombre del gerente es obligatorio");
  if ((channel === "WHATSAPP" || channel === "BOTH") && (!whatsapp || whatsapp.replace(/\D/g, "").length < 8))
    throw new HttpError(400, "Ingresa un número de WhatsApp válido con código de país (ej. 51987654321)");
  if ((channel === "EMAIL" || channel === "BOTH") && (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))
    throw new HttpError(400, "Ingresa un correo válido");
  return { name, channel, whatsapp, email, role: str(body.role, 100), businessId: str(body.businessId, 64), isActive: body.isActive === false ? 0 : 1 };
}

export async function validateBranch(body: any) {
  const name = str(body.name, 191);
  if (!name) throw new HttpError(400, "El nombre de la sucursal es obligatorio");
  const managerId = str(body.managerId, 64);
  if (managerId) {
    const m = await queryOne<any>("SELECT id FROM managers WHERE id = ?", [managerId]);
    if (!m) throw new HttpError(400, "El gerente seleccionado no existe");
  }
  return {
    name,
    managerId,
    businessId: str(body.businessId, 64),
    address: str(body.address, 255),
    googleReviewUrl: str(body.googleReviewUrl, 2000),
  };
}
