// Synthetic email so we can use Supabase email/password auth with just a phone+password,
// no OTP / no SMS cost. Phone is the identifier; the local domain is never delivered to.
const DOMAIN = "astrosage.local";

export function phoneToEmail(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `${digits}@${DOMAIN}`;
}

export function isValidIndianPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  // 10 digits OR 12 digits starting with 91
  return /^[6-9]\d{9}$/.test(digits) || /^91[6-9]\d{9}$/.test(digits);
}

export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("91") && digits.length === 12 ? digits.slice(2) : digits;
}