/**
 * QR Code Generator
 */

export async function generateQRCode(data: string): Promise<string> {
  // In production, use a QR code library like qrcode
  // For now, return placeholder
  return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>`;
}

export function generatePaymentQR(address: string, amount?: string): string {
  const uri = amount 
    ? `ethereum:${address}?value=${amount}`
    : `ethereum:${address}`;
  
  return uri;
}

