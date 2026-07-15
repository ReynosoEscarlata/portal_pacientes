import env from './config/env.js';
import { crearApp } from './app.js';
import { obtenerRepositorio } from './repositories/index.js';
import { sembrar } from './seed/sembrar.js';

const repositorio = obtenerRepositorio();

let legacy;
if (env.LEGACY_ENABLED) {
  legacy = (await import('../legacy/registro_viejo.js')).default;
  console.warn('[legacy] Endpoint legacy habilitado en POST /api/legacy/registro (solo práctica)');
}

const app = crearApp({ legacy });

if (env.DATA_SOURCE === 'mock' && env.SEED_MOCK) {
  const folios = await sembrar(repositorio);
  console.log(`[seed] ${folios.length} pacientes ficticios en memoria. Folios: ${folios.join(', ')}`);
}

app.listen(env.PORT, () => {
  console.log(`ClinicConnect API escuchando en http://localhost:${env.PORT} (fuente de datos: ${env.DATA_SOURCE})`);
});
