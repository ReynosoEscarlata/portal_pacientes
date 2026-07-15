// Enmascaramiento de datos personales para respuestas al cliente (LFPDPPP).

export function enmascararCurp(curp = '') {
  const v = String(curp);
  return v.slice(0, 4) + '*'.repeat(Math.max(0, v.length - 4));
}

export function enmascararTelefono(telefono = '') {
  const v = String(telefono);
  if (v.length <= 4) return '*'.repeat(v.length);
  return '*'.repeat(v.length - 4) + v.slice(-4);
}

export function enmascararCorreo(correo = '') {
  const [usuario, dominio] = String(correo).split('@');
  if (!dominio) return '***';
  return `${usuario.slice(0, 2)}***@${dominio}`;
}
