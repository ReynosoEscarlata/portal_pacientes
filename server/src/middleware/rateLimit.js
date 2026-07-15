import rateLimit from 'express-rate-limit';
import env from '../config/env.js';

const enPruebas = () => env.NODE_ENV === 'test';

export const limiteEscritura = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: enPruebas,
  message: { error: 'RATE_LIMIT', mensaje: 'Demasiadas solicitudes, intenta de nuevo más tarde' }
});

// Más estricto: evita fuerza bruta de folios / fechas de nacimiento.
export const limiteArco = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  skip: enPruebas,
  message: { error: 'RATE_LIMIT', mensaje: 'Demasiadas solicitudes ARCO, intenta de nuevo más tarde' }
});
