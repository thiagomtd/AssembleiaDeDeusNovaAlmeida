/**
 * Normaliza um número de celular brasileiro para o formato E.164 exigido pelo
 * Cognito (ex.: "(27) 99911-2233" -> "+5527999112233"). Se o usuário já digitar
 * com "+", assume que o código do país já está correto.
 */
export function normalizePhoneBR(input: string): string {
  const trimmed = input.trim();
  const digits = trimmed.replace(/\D/g, '');

  if (trimmed.startsWith('+')) return `+${digits}`;
  if (digits.startsWith('55') && digits.length >= 12) return `+${digits}`;
  return `+55${digits}`;
}

export function isValidE164(phone: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(phone);
}
