export function getProviderFullName(firstName: string | null | undefined, lastName: string | null | undefined) {
  const parts = [firstName, lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : '';
}
