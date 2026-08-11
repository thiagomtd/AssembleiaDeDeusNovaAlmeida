/** Normaliza um celular brasileiro para E.164 (mesma regra usada no backend). */
export function normalizePhoneBR(input: string): string {
  const trimmed = input.trim();
  const digits = trimmed.replace(/\D/g, '');

  if (trimmed.startsWith('+')) return `+${digits}`;
  if (digits.startsWith('55') && digits.length >= 12) return `+${digits}`;
  return `+55${digits}`;
}
