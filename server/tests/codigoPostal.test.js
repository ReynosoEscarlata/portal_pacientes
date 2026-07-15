import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.DATA_SOURCE = 'mock';

const { esquemaDomicilio } = await import('../src/validation/schemas.js');

const base = {
  calle: 'Av. Siempre Viva',
  numero: '742',
  colonia: 'Centro',
  cp: '06000',
  municipio: 'Cuauhtémoc',
  estado: 'DF'
};

test('acepta un domicilio válido con C.P. de 5 dígitos', () => {
  const r = esquemaDomicilio.safeParse(base);
  assert.equal(r.success, true);
});

test('rechaza códigos postales inválidos', () => {
  for (const cp of ['1000', '010001', 'ABCDE', '06 00', '']) {
    const r = esquemaDomicilio.safeParse({ ...base, cp });
    assert.equal(r.success, false, `debería rechazar C.P.: "${cp}"`);
  }
});

test('rechaza entidad federativa fuera del catálogo', () => {
  const r = esquemaDomicilio.safeParse({ ...base, estado: 'ZZ' });
  assert.equal(r.success, false);
});
