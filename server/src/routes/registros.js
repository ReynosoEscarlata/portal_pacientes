import { Router } from 'express';
import { configFases, fasesFormulario, obtenerFase, indiceDeFase } from '../config/fases.js';
import { esquemasPorFase } from '../validation/schemas.js';
import { obtenerRepositorio } from '../repositories/index.js';
import { cifrar, descifrar, estaCifrado } from '../crypto/cipher.js';
import { generarFolio } from '../utils/folio.js';
import { AppError, UUID_REGEX } from '../utils/errors.js';
import { limiteEscritura } from '../middleware/rateLimit.js';

const router = Router();

function validarId(id) {
  if (!UUID_REGEX.test(id)) {
    throw new AppError(404, 'NO_ENCONTRADO', 'Borrador no encontrado');
  }
  return id;
}

async function cargarDraft(id) {
  const draft = await obtenerRepositorio().obtenerDraft(validarId(id));
  if (!draft) throw new AppError(404, 'NO_ENCONTRADO', 'Borrador no encontrado');
  return draft;
}

router.post('/draft', limiteEscritura, async (req, res, next) => {
  try {
    const draft = await obtenerRepositorio().crearDraft();
    res.status(201).json({ id: draft.id, faseActual: draft.faseActual });
  } catch (err) {
    next(err);
  }
});

router.get('/draft/:id', async (req, res, next) => {
  try {
    const draft = await cargarDraft(req.params.id);
    const datos = { ...draft.datos };
    for (const fase of configFases.fases) {
      if (fase.sensible && estaCifrado(datos[fase.id])) {
        datos[fase.id] = descifrar(datos[fase.id]);
      }
    }
    res.json({ id: draft.id, faseActual: draft.faseActual, datos, actualizadoEn: draft.actualizadoEn });
  } catch (err) {
    next(err);
  }
});

router.put('/draft/:id/fase/:faseId', limiteEscritura, async (req, res, next) => {
  try {
    const { faseId } = req.params;
    const fase = obtenerFase(faseId);
    const esquema = esquemasPorFase[faseId];
    if (!fase || !esquema) {
      throw new AppError(404, 'FASE_INVALIDA', 'La fase indicada no existe o no admite captura');
    }

    const draft = await cargarDraft(req.params.id);
    let datosValidados = esquema.parse(req.body?.datos ?? {});

    if (faseId === 'consentimiento') {
      if (datosValidados.versionAviso !== configFases.versionAviso) {
        throw new AppError(
          409,
          'AVISO_DESACTUALIZADO',
          'El aviso de privacidad cambió; recarga la página para leer la versión vigente'
        );
      }
      // Consentimiento trazable: versión aceptada, momento e IP de origen.
      datosValidados = {
        aceptado: true,
        versionAviso: datosValidados.versionAviso,
        timestamp: new Date().toISOString(),
        ip: req.ip
      };
    }

    const aGuardar = fase.sensible ? cifrar(datosValidados) : datosValidados;
    const faseActual = Math.max(draft.faseActual, indiceDeFase(faseId) + 1);

    await obtenerRepositorio().actualizarDraft(draft.id, {
      datos: { ...draft.datos, [faseId]: aGuardar },
      faseActual
    });

    res.json({ ok: true, faseActual });
  } catch (err) {
    next(err);
  }
});

router.post('/draft/:id/enviar', limiteEscritura, async (req, res, next) => {
  try {
    const repo = obtenerRepositorio();
    const draft = await cargarDraft(req.params.id);

    for (const fase of fasesFormulario) {
      if (!draft.datos[fase.id]) {
        throw new AppError(422, 'INCOMPLETO', `Falta completar la fase "${fase.titulo}"`);
      }
    }

    const consentimiento = draft.datos.consentimiento;
    if (!consentimiento?.aceptado) {
      throw new AppError(
        422,
        'CONSENTIMIENTO_REQUERIDO',
        'Se requiere el consentimiento expreso del aviso de privacidad'
      );
    }

    let folio = generarFolio();
    while (await repo.existeFolio(folio)) {
      folio = generarFolio();
    }

    await repo.crearRegistro({
      folio,
      datosPersonales: draft.datos.datos_personales,
      domicilio: draft.datos.domicilio,
      datosClinicos: draft.datos.datos_clinicos,
      consentimiento,
      creadoEn: new Date().toISOString()
    });
    await repo.eliminarDraft(draft.id);

    res.status(201).json({ folio });
  } catch (err) {
    next(err);
  }
});

export default router;
