import express from 'express';
import { seguridadBase } from './middleware/security.js';
import { manejadorErrores } from './middleware/errorHandler.js';
import rutasFases from './routes/phases.js';
import rutasRegistros from './routes/registros.js';
import rutasArco from './routes/arco.js';
import { obtenerRepositorio } from './repositories/index.js';

export function crearApp({ legacy } = {}) {
  const app = express();

  seguridadBase(app);
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/salud', (req, res) => {
    res.json({ ok: true, fuenteDatos: obtenerRepositorio().tipo });
  });

  app.use('/api/phases', rutasFases);
  app.use('/api/registros', rutasRegistros);
  app.use('/api/arco', rutasArco);

  if (legacy) {
    app.post('/api/legacy/registro', legacy);
  }

  app.use((req, res) => {
    res.status(404).json({ error: 'NO_ENCONTRADO', mensaje: 'Recurso no encontrado' });
  });
  app.use(manejadorErrores);

  return app;
}
