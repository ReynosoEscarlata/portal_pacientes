// Enmascaramiento de datos personales para el resumen (LFPDPPP).

export function enmascararCurp(curp: string): string {
  if (!curp) return '';
  return curp.slice(0, 4) + '*'.repeat(Math.max(0, curp.length - 4));
}

export function enmascararTelefono(telefono: string): string {
  if (!telefono) return '';
  if (telefono.length <= 4) return '*'.repeat(telefono.length);
  return '*'.repeat(telefono.length - 4) + telefono.slice(-4);
}

export function enmascararCorreo(correo: string): string {
  const [usuario, dominio] = correo.split('@');
  if (!dominio) return '***';
  return `${usuario.slice(0, 2)}***@${dominio}`;
}

export function iniciales(nombre: string, apellido: string): string {
  const n = (nombre ?? '').trim().charAt(0);
  const a = (apellido ?? '').trim().charAt(0);
  return `${n}${a}`.toUpperCase() || '?';
}
