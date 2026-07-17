import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

process.env.NODE_ENV = 'test';
process.env.DATA_SOURCE = 'mock';

const { CURP_REGEX } = await import('../src/validation/schemas.js');

const configPath = fileURLToPath(new URL('../src/config/phases.config.json', import.meta.url));
const config = JSON.parse(readFileSync(configPath, 'utf-8'));

function obtenerCampoCurp() {
  const fase = config.fases.find((f) => f.id === 'datos_personales');
  return fase.campos.find((c) => c.nombre === 'curp');
}

test('phases.config.json curp.pattern coincide byte-for-byte con CURP_REGEX', () => {
  const campoCurp = obtenerCampoCurp();
  assert.equal(campoCurp.pattern, CURP_REGEX.source);
});
