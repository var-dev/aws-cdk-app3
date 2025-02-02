
export function getCookie(name: string): string {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (
    Array.isArray(parts) &&
    parts.length === 2
  ) return parts.pop()!.split(';').shift() || '';
  return '';
}