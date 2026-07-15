import crypto from 'node:crypto';
import env from '../config/env.js';

const ALGORITMO = 'aes-256-gcm';
const PREFIJO = 'v1';

let clave = null;

function obtenerClave() {
  if (clave) return clave;
  if (/^[0-9a-fA-F]{64}$/.test(env.ENCRYPTION_KEY)) {
    clave = Buffer.from(env.ENCRYPTION_KEY, 'hex');
    return clave;
  }
  if (env.NODE_ENV === 'production') {
    throw new Error('ENCRYPTION_KEY debe ser una cadena hex de 64 caracteres en producción');
  }
  clave = crypto.scryptSync('clinicconnect-clave-solo-desarrollo', 'clinicconnect-sal', 32);
  if (env.NODE_ENV !== 'test') {
    console.warn('[cipher] ENCRYPTION_KEY no configurada: usando clave derivada SOLO para desarrollo');
  }
  return clave;
}

export function cifrar(objeto) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITMO, obtenerClave(), iv);
  const texto = JSON.stringify(objeto);
  const datos = Buffer.concat([cipher.update(texto, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [PREFIJO, iv.toString('base64'), tag.toString('base64'), datos.toString('base64')].join('.');
}

export function descifrar(cadena) {
  const [prefijo, ivB64, tagB64, datosB64] = String(cadena).split('.');
  if (prefijo !== PREFIJO) throw new Error('Formato de dato cifrado no reconocido');
  const decipher = crypto.createDecipheriv(ALGORITMO, obtenerClave(), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  const texto = Buffer.concat([
    decipher.update(Buffer.from(datosB64, 'base64')),
    decipher.final()
  ]).toString('utf8');
  return JSON.parse(texto);
}

export function estaCifrado(valor) {
  return typeof valor === 'string' && valor.startsWith(`${PREFIJO}.`);
}
