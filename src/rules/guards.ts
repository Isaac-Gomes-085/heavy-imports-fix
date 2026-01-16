export function isClientComponent(code: string): boolean {
  return /^["']use client["']/.test(code.trim());
}

export function isHook(name: string): boolean {
  return /^use[A-Z]/.test(name);
}