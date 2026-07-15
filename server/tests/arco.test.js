import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.DATA_SOURCE = 'mock';

const { crearApp } = await import('../src/app.js');
const { configFases } = await import('../src/config/fases.js');

const app = crearApp();

const personales = {
  nombre: 'María Guadalupe',
  primerApellido: 'Pérez',
  segundoApellido: 'García',
  fechaNacimiento: '1985-03-12',
  sexo: 'M',
  curp: 'PEGG850312MDFRRR04',
  telefono: '5512345678',
  correo: 'maria@example.com'
};
const domicilio = {
  calle: 'Av. Siempre Viva',
  numero: '742',
  colonia: 'Centro',
  cp: '06000',
  municipio: 'Cuauhtémoc',
  estado: 'DF'
};
const clinicos = {
  motivoConsulta: 'Dolor de cabeza recurrente',
  alergias: 'Penicilina',
  medicamentosActuales: '',
  antecedentes: ''
};

async function crearPreRegistro() {
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
  await request(app)
    .put(`/api/registros/draft/${draft.id}/fase/consentimiento`)
    .send({ datos: { aceptado: true, versionAviso: configFases.versionAviso } })
    .expect(200);
  const { body } = await request(app).post(`/api/registros/draft/${draft.id}/enviar`).expect(201);
  return body.folio;
}

test('flujo ARCO: consulta con datos enmascarados y eliminación', async () => {
  const folio = await crearPreRegistro();
  assert.match(folio, /^CC-\d{4}-[A-Z0-9]{6}$/);

  // Acceso: la CURP regresa enmascarada (4 visibles) y lo clínico descifrado.
  const consulta = await request(app)
    .post('/api/arco/consulta')
    .send({ folio, fechaNacimiento: personales.fechaNacimiento })
    .expect(200);
  assert.equal(consulta.body.datosPersonales.curp, 'PEGG' + '*'.repeat(14));
  assert.ok(consulta.body.datosPersonales.telefono.endsWith('5678'));
  assert.equal(consulta.body.datosClinicos.motivoConsulta, clinicos.motivoConsulta);
  assert.equal(consulta.body.consentimiento.aceptado, true);
  assert.ok(consulta.body.consentimiento.timestamp);

  // Fecha de nacimiento incorrecta: misma respuesta que folio inexistente.
  await request(app)
    .post('/api/arco/consulta')
    .send({ folio, fechaNacimiento: '1990-01-01' })
    .expect(404);

  // Cancelación: elimina y deja de ser consultable.
  await request(app)
    .post('/api/arco/eliminar')
    .send({ folio, fechaNacimiento: personales.fechaNacimiento })
    .expect(200);
  await request(app)
    .post('/api/arco/consulta')
    .send({ folio, fechaNacimiento: personales.fechaNacimiento })
    .expect(404);
});

test('rechaza folios con formato inválido', async () => {
  await request(app)
    .post('/api/arco/consulta')
    .send({ folio: "CC-2026'; DROP TABLE pre_registros;--", fechaNacimiento: '1990-01-01' })
    .expect(422);
});
