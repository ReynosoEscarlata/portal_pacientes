import { Router } from 'express';
import { z } from 'zod';
import { obtenerRepositorio } from '../repositories/index.js';
import { descifrar, estaCifrado } from '../crypto/cipher.js';
import { enmascararCurp, enmascararTelefono, enmascararCorreo } from '../utils/mask.js';
import { AppError } from '../utils/errors.js';
import { limiteArco } from '../middleware/rateLimit.js';

const router = Router();

const esquemaArco = z
  .object({
    folio: z
      .string({ required_error: 'El folio es obligatorio' })
      .trim()
      .transform((v) => v.toUpperCase())
      .pipe(z.string().regex(/^CC-\d{4}-[A-Z0-9]{6}$/, 'El folio no tiene un formato válido')),
    fechaNacimiento: z
      .string({ required_error: 'La fecha de nacimiento es obligatoria' })
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Usa el formato AAAA-MM-DD')
  })
  .strict();

// Mismo mensaje si el folio no existe o la fecha no coincide (evita enumeración).
const noEncontrado = () =>
  new AppError(404, 'NO_ENCONTRADO', 'No se encontró un pre-registro con esos datos');

async function autenticar(body) {
  const { folio, fechaNacimiento } = esquemaArco.parse(body);
  const registro = await obtenerRepositorio().obtenerRegistroPorFolio(folio);
  if (!registro || registro.datosPersonales?.fechaNacimiento !== fechaNacimiento) {
    throw noEncontrado();
  }
  return registro;
}

// Derecho de Acceso (LFPDPPP): consulta con folio + fecha de nacimiento.
router.post('/consulta', limiteArco, async (req, res, next) => {
  try {
    const registro = await autenticar(req.body ?? {});
    const p = registro.datosPersonales;
    res.json({
      folio: registro.folio,
      creadoEn: registro.creadoEn,
      datosPersonales: {
        ...p,
        curp: enmascararCurp(p.curp),
        telefono: enmascararTelefono(p.telefono),
        correo: enmascararCorreo(p.correo)
      },
      domicilio: registro.domicilio,
      datosClinicos: estaCifrado(registro.datosClinicos)
        ? descifrar(registro.datosClinicos)
        : registro.datosClinicos,
      consentimiento: registro.consentimiento
    });
  } catch (err) {
    next(err);
  }
});

// Derecho de Cancelación (LFPDPPP): elimina el pre-registro.
router.post('/eliminar', limiteArco, async (req, res, next) => {
  try {
    const registro = await autenticar(req.body ?? {});
    await obtenerRepositorio().eliminarRegistroPorFolio(registro.folio);
    res.json({ eliminado: true, mensaje: 'El pre-registro y sus datos fueron eliminados' });
  } catch (err) {
    next(err);
  }
});

export default router;
