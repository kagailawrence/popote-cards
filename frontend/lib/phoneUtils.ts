/**
 * Normalizes a phone number to standard 254XXXXXXXXX format.
 * - Strips all non-digit characters.
 * - Replaces leading '0' with '254'.
 * - Prepends '254' to 9-digit numbers starting with '7' or '1'.
 * - Leaves other strings as-is.
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

/**
 * Sanitizes input text to only allow phone number characters: digits and optionally a leading plus.
 */
export function sanitizePhoneInput(input: string): string {
  const hasPlus = input.startsWith('+')
  const digits = input.replace(/[^\d]/g, '')
  return (hasPlus ? '+' : '') + digits
}
