import env from '../config/env.js';
import { crearRepositorioMemoria } from './memoryRepo.js';
import { crearRepositorioPostgres } from './postgresRepo.js';

let repositorio = null;

// Patrón Repository: la implementación se elige por DATA_SOURCE (mock | postgres).
export function obtenerRepositorio() {
  if (!repositorio) {
    repositorio =
      env.DATA_SOURCE === 'postgres' ? crearRepositorioPostgres() : crearRepositorioMemoria();
  }
  return repositorio;
}
