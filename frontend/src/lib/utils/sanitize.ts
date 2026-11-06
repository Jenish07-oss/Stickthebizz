export function cleanPhone(phone?: string | null): string {
  if (!phone) return "";
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  return digits;
}

export const cleanIndianPhone = cleanPhone;

export function maskPhone(phone?: string | null): string {
  const cleaned = cleanPhone(phone);
  if (cleaned.length !== 10) return "Walk-in Diner";
  return `+91 ${cleaned.slice(0, 2)}*** **${cleaned.slice(-2)}`;
}

export function sanitizeHtml(input: string): string {
  if (!input) return "";
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function decodeHtml(input: string): string {
  if (!input) return "";
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}

