import crypto from 'node:crypto';

// Sin caracteres ambiguos (0/O, 1/I) para lectura por teléfono o en recepción.
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generarFolio(fecha = new Date()) {
  let sufijo = '';
  for (let i = 0; i < 6; i += 1) {
    sufijo += ALFABETO[crypto.randomInt(ALFABETO.length)];
  }
  return `CC-${fecha.getFullYear()}-${sufijo}`;
}

export const FOLIO_REGEX = /^CC-\d{4}-[A-Z0-9]{6}$/;
