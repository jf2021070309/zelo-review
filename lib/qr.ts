import QRCode from "qrcode";
import JSZip from "jszip";

export interface QRCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

export async function generateQRCodeDataUrl(text: string, options?: QRCodeOptions): Promise<string> {
  return QRCode.toDataURL(text, {
    width: options?.width || 500,
    margin: options?.margin !== undefined ? options?.margin : 1,
    color: {
      dark: options?.color?.dark || "#000000",
      light: options?.color?.light || "#ffffff",
    },
    errorCorrectionLevel: "H",
  });
}

export async function generateQRCodeSVG(text: string, options?: QRCodeOptions): Promise<string> {
  return QRCode.toString(text, {
    type: "svg",
    width: options?.width || 500,
    margin: options?.margin !== undefined ? options?.margin : 1,
    color: {
      dark: options?.color?.dark || "#000000",
      light: options?.color?.light || "#ffffff",
    },
    errorCorrectionLevel: "H",
  });
}

export interface BatchExportItem {
  code: string;
  pin: string;
  qrUrl: string;
  nfcUrl: string;
  batchId?: string;
}

export async function createBatchPrintZip(
  items: BatchExportItem[],
  batchName: string
): Promise<Buffer> {
  const zip = new JSZip();
  const folderQrPng = zip.folder("01_QR_Codes_PNG_300DPI");
  const folderQrSvg = zip.folder("02_QR_Codes_Vector_SVG");

  // 1. Generate QR codes for all items
  for (const item of items) {
    // PNG DataUrl
    const dataUrl = await generateQRCodeDataUrl(item.qrUrl, { width: 1000, margin: 1 });
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
    folderQrPng?.file(`${item.code}_QR.png`, base64Data, { base64: true });

    // SVG Vector
    const svgContent = await generateQRCodeSVG(item.qrUrl, { width: 1000, margin: 1 });
    folderQrSvg?.file(`${item.code}_QR.svg`, svgContent);
  }

  // 2. Generate CSV Manifest for UV Printer / Laser Engraver / Production Sheet
  let csvContent = "ID,Code,ActivationPIN,QR_URL,NFC_URL,Status\n";
  for (const item of items) {
    csvContent += `"${item.code}","${item.code}","${item.pin}","${item.qrUrl}","${item.nfcUrl}","READY_FOR_PRODUCTION"\n`;
  }
  zip.file(`MANIFEST_${batchName.replace(/\s+/g, "_")}.csv`, csvContent);

  // 3. Readme instructions for printing workshop
  const readmeContent = `=====================================================
ZELO REVIEW - GUÍA DE PRODUCCIÓN IMPRENTA UV Y NFC
Lote: ${batchName}
Total placas: ${items.length}
=====================================================

1. ESTRUCTURA DE ARCHIVOS:
   - /01_QR_Codes_PNG_300DPI: Códigos QR listos para RIP de Impresión UV (Alta resolución 1000x1000 px).
   - /02_QR_Codes_Vector_SVG: Códigos vectoriales para grabado láser o corte.
   - MANIFEST.csv: Hoja de datos con URLs y PINs para automatización VDP / control de calidad.

2. PROGRAMACIÓN DE CHIPS NFC (NTAG213 / NTAG215 / NTAG216):
   - Cada placa debe grabarse con el registro URI correspondiente en el CSV (Columna NFC_URL).
   - Ejemplo de URL para NFC: https://zelo.pe/r/ZL-XXXXXX?src=nfc

3. CÓDIGO QR IMPRESO:
   - Debe apuntar a la URL con origen QR: https://zelo.pe/r/ZL-XXXXXX?src=qr

4. ACTIVACIÓN POR EL CLIENTE:
   - El cliente escaneará la placa o entrará a zelo.pe/claim/[CODE] e ingresará el PIN de activación.
=====================================================
`;
  zip.file("LEEME_INSTRUCCIONES_PRODUCCION.txt", readmeContent);

  return zip.generateAsync({ type: "nodebuffer" });
}
