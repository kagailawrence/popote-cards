/**
 * Normalizes a phone number to standard 254XXXXXXXXX format.
 * - Strips all non-digit characters.
 * - Replaces leading '0' with '254'.
 * - Prepends '254' to 9-digit numbers starting with '7' or '1'.
 * - Leaves other strings as-is (will fail verification).
 */
export function normalizePhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('0') && digits.length === 10) {
    return '254' + digits.slice(1)
  }
  if (digits.startsWith('254') && digits.length === 12) {
    return digits
  }
  if ((digits.startsWith('7') || digits.startsWith('1')) && digits.length === 9) {
    return '254' + digits
  }
  return digits
}

/**
 * Validates whether a phone number is a valid Kenyan mobile number after normalization.
 * Valid numbers must start with 254 followed by 7 or 1, and then 8 digits.
 */
export function isValidKenyanPhone(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone)
  return /^254[17]\d{8}$/.test(normalized)
}
