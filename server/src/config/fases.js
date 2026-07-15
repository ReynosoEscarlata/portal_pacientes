import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ruta = fileURLToPath(new URL('./phases.config.json', import.meta.url));

export const configFases = JSON.parse(readFileSync(ruta, 'utf8'));

export const fasesFormulario = configFases.fases.filter((f) => f.tipo === 'form');

export function obtenerFase(id) {
  return configFases.fases.find((f) => f.id === id) ?? null;
}

export function indiceDeFase(id) {
  return configFases.fases.findIndex((f) => f.id === id);
}
