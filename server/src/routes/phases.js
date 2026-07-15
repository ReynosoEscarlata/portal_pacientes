import { Router } from 'express';
import { configFases } from '../config/fases.js';
import { SEXO, ENTIDADES } from '../validation/catalogos.js';

const router = Router();

// Configuración dinámica del wizard: el frontend renderiza lo que aquí se publique.
router.get('/', (req, res) => {
  res.json({
    versionAviso: configFases.versionAviso,
    fases: configFases.fases,
    catalogos: { sexo: SEXO, entidades: ENTIDADES }
  });
});

export default router;
