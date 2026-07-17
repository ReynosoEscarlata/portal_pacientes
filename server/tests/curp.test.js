import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.DATA_SOURCE = 'mock';

const { esquemaDatosPersonales, CURP_REGEX } = await import('../src/validation/schemas.js');

const base = {
  nombre: 'María Guadalupe',
  primerApellido: 'Pérez',
  segundoApellido: 'García',
  fechaNacimiento: '1985-03-12',
  sexo: 'M',
  curp: 'PEGG850312MDFRRR04',
  telefono: '5512345678',
  correo: 'maria@example.com'
};

test('acepta CURP válidas', () => {
  assert.ok(CURP_REGEX.test('PEGG850312MDFRRR04'));
  assert.ok(CURP_REGEX.test('HELJ781130HMCRPN05'));
  assert.ok(CURP_REGEX.test('RACA920704MJCMRN01'));
});

test('acepta CURP post-2000 (letra en posición 17)', () => {
  assert.ok(CURP_REGEX.test('MAPA000115HDFRRLA1'));
  const r = esquemaDatosPersonales.safeParse({
    ...base,
    curp: 'MAPA000115HDFRRLA1',
    fechaNacimiento: '2000-01-15',
    sexo: 'H'
  });
  assert.equal(r.success, true);
});

test('rechaza CURP con diferenciador o dígito verificador inválido', () => {
  const invalidas = [
    'MAPA000115HDFRRL#1', // carácter no alfanumérico en posición 17
    'MAPA000115HDFRRLAX' // letra en posición 18 (debe ser dígito)
  ];
  for (const curp of invalidas) {
    const r = esquemaDatosPersonales.safeParse({ ...base, curp });
    assert.equal(r.success, false, `debería rechazar: ${curp}`);
  }
});

test('acepta CURP en minúsculas (se normaliza a mayúsculas)', () => {
  const r = esquemaDatosPersonales.safeParse({ ...base, curp: 'pegg850312mdfrrr04' });
  assert.equal(r.success, true);
  assert.equal(r.data.curp, 'PEGG850312MDFRRR04');
});

test('rechaza CURP con formato inválido', () => {
  const invalidas = [
    'PEGG850312MDFRRR0', // 17 caracteres
    'PEGG850312MDFRRR045', // 19 caracteres
    'PEGG851312MDFRRR04', // mes 13
    'PEGG850332MDFRRR04', // día 32
    'PEGG850312XDFRRR04', // sexo inválido en posición 11
    'PEGG850312MXXRRR04', // entidad federativa inexistente
    '1EGG850312MDFRRR04' // inicia con dígito
  ];
  for (const curp of invalidas) {
    const r = esquemaDatosPersonales.safeParse({ ...base, curp });
    assert.equal(r.success, false, `debería rechazar: ${curp}`);
  }
});

test('rechaza CURP cuya fecha codificada no coincide con fechaNacimiento', () => {
  const r = esquemaDatosPersonales.safeParse({ ...base, fechaNacimiento: '1985-03-13' });
  assert.equal(r.success, false);
});

test('rechaza CURP cuyo sexo codificado no coincide con sexo', () => {
  const r = esquemaDatosPersonales.safeParse({ ...base, sexo: 'H' });
  assert.equal(r.success, false);
  // Guarda la atribución de campo: manejadorErrores deriva `campo` de `path`,
  // así que este assert protege el campo: 'curp' contra un cambio futuro de path.
  assert.equal(r.error.issues[0].path[0], 'curp');
});

test('sexo NE omite la verificación de sexo pero conserva la de fecha', () => {
  // base.curp codifica sexo 'M'; sin el skip de NE, esta primera aserción
  // rechazaría ('M' !== 'NE'), por lo que el success: true aquí es discriminante,
  // no tautológico.
  const r1 = esquemaDatosPersonales.safeParse({ ...base, sexo: 'NE' });
  assert.equal(r1.success, true);

  const r2 = esquemaDatosPersonales.safeParse({ ...base, sexo: 'NE', fechaNacimiento: '1985-03-13' });
  assert.equal(r2.success, false);
});

test('acepta payload con CURP semánticamente consistente (sin regresión)', () => {
  const r = esquemaDatosPersonales.safeParse(base);
  assert.equal(r.success, true);
});

test('CURP con formato inválido produce un solo issue (guard de superRefine)', () => {
  const r = esquemaDatosPersonales.safeParse({ ...base, curp: 'MAPA000115HDFRRL#1' });
  assert.equal(r.success, false);
  // Un solo issue confirma que el guard de retorno anticipado del superRefine
  // se activó; sin el guard, esta CURP inválida además dispararía los checks
  // de fecha y sexo, produciendo tres issues.
  assert.equal(r.error.issues.length, 1);
});
