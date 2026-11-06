/**
 * Indian Retail Data Sanitization & DPDP Compliance Utilities
 */

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

export function isValidIndianPhone(phone?: string | null): boolean {
  const cleaned = cleanPhone(phone);
  return cleaned.length === 10 && /^[6-9]\d{9}$/.test(cleaned);
}

export function maskPhone(phone?: string | null): string {
  const cleaned = cleanPhone(phone);
  if (cleaned.length !== 10) return "Walk-in Diner";
  return `+91 ${cleaned.slice(0, 2)}*** **${cleaned.slice(-2)}`;
}

export function sanitizeString(input?: string | null): string {
  if (!input) return "";
  return input
    .trim()
    .replace(/[<>]/g, "") // Strip dangerous HTML tags
    .slice(0, 500); // Guard max length
}

