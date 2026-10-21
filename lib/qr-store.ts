import { HttpError } from "./reviews";
import { queryOne } from "./db";
import { getQrTypeDef, validateQrData, QrType } from "./qr-types";
import { str } from "./api-helpers";

/** Normaliza/valida el cuerpo de creación/edición de un QR. */
export async function validateQrBody(body: any) {
  const type = String(body.type || "") as QrType;
  const def = getQrTypeDef(type);
  if (!def) throw new HttpError(400, "Tipo de QR inválido");
  const data = body.data && typeof body.data === "object" ? body.data : {};
  const err = validateQrData(type, data);
  if (err) throw new HttpError(400, err);
  const name = str(body.name, 191) || `${def.label} ${new Date().toLocaleDateString("es-PE")}`;
  const isDynamic = def.dynamicOnly ? 1 : type === "BARCODE" ? 0 : def.supportsStatic && body.isDynamic === false ? 0 : 1;
  let branchId: string | null = null;
  let businessId: string | null = null;
  if (type === "REVIEW_FILTER") {
    const branch = await queryOne<any>("SELECT id, businessId FROM branches WHERE id = ?", [data.branchId]);
    if (!branch) throw new HttpError(400, "Selecciona una sucursal válida (créala en el módulo Gerentes y Sucursales)");
    branchId = branch.id;
    businessId = branch.businessId || null;
  }
  const design = body.design && typeof body.design === "object" ? JSON.stringify(body.design) : null;
  if (design && design.length > 3_000_000) throw new HttpError(413, "El logo es demasiado pesado (máx. ~2 MB)");
  const dataJson = JSON.stringify(data);
  if (dataJson.length > 1_000_000) throw new HttpError(413, "El contenido es demasiado grande");
  return { type, name, isDynamic, data: dataJson, design, branchId, businessId, status: body.status === "PAUSED" ? "PAUSED" : "ACTIVE" };
}
