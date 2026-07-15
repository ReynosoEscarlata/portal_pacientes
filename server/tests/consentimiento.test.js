import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.DATA_SOURCE = 'mock';

const { esquemaConsentimiento } = await import('../src/validation/schemas.js');
const { crearApp } = await import('../src/app.js');
const { configFases } = await import('../src/config/fases.js');

const app = crearApp();

const personales = {
  nombre: 'Juan Carlos',
  primerApellido: 'Hernández',
  segundoApellido: 'López',
  fechaNacimiento: '1978-11-30',
  sexo: 'H',
  curp: 'HELJ781130HMCRPN05',
  telefono: '5598765432',
  correo: 'juan@example.com'
};
const domicilio = {
  calle: 'Calle de la Rosa',
  numero: '12-B',
  colonia: 'Jardines',
  cp: '50110',
  municipio: 'Toluca',
  estado: 'MC'
};
const clinicos = { motivoConsulta: 'Revisión anual de control' };

test('el esquema exige consentimiento expreso (aceptado: true)', () => {
  assert.equal(
    esquemaConsentimiento.safeParse({ aceptado: true, versionAviso: '1.0' }).success,
    true
  );
  assert.equal(
    esquemaConsentimiento.safeParse({ aceptado: false, versionAviso: '1.0' }).success,
    false
  );
  assert.equal(esquemaConsentimiento.safeParse({ versionAviso: '1.0' }).success, false);
});

test('no se puede enviar el registro sin consentimiento', async () => {
  const { body: draft } = await request(app).post('/api/registros/draft').expect(201);

  await request(app)
    .put(`/api/registros/draft/${draft.id}/fase/datos_personales`)
    .send({ datos: personales })
    .expect(200);
  await request(app)
    .put(`/api/registros/draft/${draft.id}/fase/domicilio`)
    .send({ datos: domicilio })
    .expect(200);
  await request(app)
    .put(`/api/registros/draft/${draft.id}/fase/datos_clinicos`)
    .send({ datos: clinicos })
    .expect(200);

  const respuesta = await request(app)
    .post(`/api/registros/draft/${draft.id}/enviar`)
    .expect(422);
  assert.equal(respuesta.body.error, 'CONSENTIMIENTO_REQUERIDO');
});

test('rechaza el consentimiento con aceptado: false vía API', async () => {
  const { body: draft } = await request(app).post('/api/registros/draft').expect(201);
  const respuesta = await request(app)
    .put(`/api/registros/draft/${draft.id}/fase/consentimiento`)
    .send({ datos: { aceptado: false, versionAviso: configFases.versionAviso } })
    .expect(422);
  assert.equal(respuesta.body.error, 'VALIDACION');
});

test('rechaza una versión desactualizada del aviso de privacidad', async () => {
  const { body: draft } = await request(app).post('/api/registros/draft').expect(201);
  await request(app)
    .put(`/api/registros/draft/${draft.id}/fase/consentimiento`)
    .send({ datos: { aceptado: true, versionAviso: '0.1-obsoleta' } })
    .expect(409);
});
