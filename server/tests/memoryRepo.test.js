import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.DATA_SOURCE = 'mock';

const { crearRepositorioMemoria } = await import('../src/repositories/memoryRepo.js');

test('ciclo de vida de un borrador', async () => {
  const repo = crearRepositorioMemoria();

  const draft = await repo.crearDraft();
  assert.ok(draft.id);
  assert.equal(draft.faseActual, 0);
  assert.deepEqual(draft.datos, {});

  const actualizado = await repo.actualizarDraft(draft.id, {
    faseActual: 1,
    datos: { datos_personales: { nombre: 'Ana' } }
  });
  assert.equal(actualizado.faseActual, 1);

  const recuperado = await repo.obtenerDraft(draft.id);
  assert.equal(recuperado.datos.datos_personales.nombre, 'Ana');

  assert.equal(await repo.eliminarDraft(draft.id), true);
  assert.equal(await repo.obtenerDraft(draft.id), null);
});

test('las copias devueltas no comparten referencia con el almacén', async () => {
  const repo = crearRepositorioMemoria();
  const draft = await repo.crearDraft();
  const a = await repo.obtenerDraft(draft.id);
  a.datos.hackeo = 'mutación externa';
  const b = await repo.obtenerDraft(draft.id);
  assert.equal(b.datos.hackeo, undefined);
});

test('ciclo de vida de un registro por folio', async () => {
  const repo = crearRepositorioMemoria();
  const registro = {
    folio: 'CC-2026-TEST01',
    datosPersonales: { nombre: 'Ana', fechaNacimiento: '1992-07-04' },
    domicilio: { cp: '44160' },
    datosClinicos: 'v1.aaa.bbb.ccc',
    consentimiento: { aceptado: true }
  };

  assert.equal(await repo.existeFolio(registro.folio), false);
  await repo.crearRegistro(registro);
  assert.equal(await repo.existeFolio(registro.folio), true);

  const recuperado = await repo.obtenerRegistroPorFolio(registro.folio);
  assert.equal(recuperado.datosPersonales.nombre, 'Ana');

  assert.equal(await repo.eliminarRegistroPorFolio(registro.folio), true);
  assert.equal(await repo.obtenerRegistroPorFolio(registro.folio), null);
});
