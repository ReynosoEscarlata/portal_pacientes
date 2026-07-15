import crypto from 'node:crypto';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';

// eslint-disable-next-line no-unused-vars
export function manejadorErrores(err, req, res, next) {
  if (err instanceof ZodError) {
    return res.status(422).json({
      error: 'VALIDACION',
      mensaje: 'Los datos enviados no son válidos',
      detalles: err.errors.map((e) => ({ campo: e.path.join('.'), mensaje: e.message }))
    });
  }

  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.codigo, mensaje: err.message });
  }

  if (err.type === 'entity.parse.failed' || err.type === 'entity.too.large') {
    return res.status(400).json({ error: 'CUERPO_INVALIDO', mensaje: 'El cuerpo de la petición no es válido' });
  }

  // Nunca exponer stack traces al cliente ni loguear datos personales.
  const id = crypto.randomUUID();
  console.error(`[error ${id}] ${err.name}: ${err.message}`);
  return res.status(500).json({ error: 'INTERNO', mensaje: 'Ocurrió un error inesperado', id });
}
