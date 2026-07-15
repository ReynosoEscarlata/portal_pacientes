import pg from 'pg';
import env from '../config/env.js';

// Todas las consultas usan parámetros ($1, $2, ...) para prevenir inyección SQL.

function mapDraft(fila) {
  return {
    id: fila.id,
    faseActual: fila.fase_actual,
    datos: fila.datos,
    creadoEn: fila.creado_en,
    actualizadoEn: fila.actualizado_en
  };
}

function mapRegistro(fila) {
  return {
    folio: fila.folio,
    datosPersonales: fila.datos_personales,
    domicilio: fila.domicilio,
    datosClinicos: fila.datos_clinicos,
    consentimiento: fila.consentimiento,
    creadoEn: fila.creado_en
  };
}

export function crearRepositorioPostgres() {
  const pool = new pg.Pool({ ...env.PG, max: 10 });

  return {
    tipo: 'postgres',

    async crearDraft() {
      const { rows } = await pool.query(
        `INSERT INTO drafts (datos) VALUES ('{}'::jsonb)
         RETURNING id, fase_actual, datos, creado_en, actualizado_en`
      );
      return mapDraft(rows[0]);
    },

    async obtenerDraft(id) {
      const { rows } = await pool.query(
        'SELECT id, fase_actual, datos, creado_en, actualizado_en FROM drafts WHERE id = $1',
        [id]
      );
      return rows[0] ? mapDraft(rows[0]) : null;
    },

    async actualizarDraft(id, cambios) {
      const { rows } = await pool.query(
        `UPDATE drafts
            SET fase_actual = COALESCE($2, fase_actual),
                datos = COALESCE($3::jsonb, datos),
                actualizado_en = now()
          WHERE id = $1
          RETURNING id, fase_actual, datos, creado_en, actualizado_en`,
        [id, cambios.faseActual ?? null, cambios.datos !== undefined ? JSON.stringify(cambios.datos) : null]
      );
      return rows[0] ? mapDraft(rows[0]) : null;
    },

    async eliminarDraft(id) {
      const { rowCount } = await pool.query('DELETE FROM drafts WHERE id = $1', [id]);
      return rowCount > 0;
    },

    async crearRegistro(registro) {
      const { rows } = await pool.query(
        `INSERT INTO pre_registros (folio, datos_personales, domicilio, datos_clinicos, consentimiento)
         VALUES ($1, $2::jsonb, $3::jsonb, $4, $5::jsonb)
         RETURNING folio, datos_personales, domicilio, datos_clinicos, consentimiento, creado_en`,
        [
          registro.folio,
          JSON.stringify(registro.datosPersonales),
          JSON.stringify(registro.domicilio),
          registro.datosClinicos,
          JSON.stringify(registro.consentimiento)
        ]
      );
      return mapRegistro(rows[0]);
    },

    async obtenerRegistroPorFolio(folio) {
      const { rows } = await pool.query(
        `SELECT folio, datos_personales, domicilio, datos_clinicos, consentimiento, creado_en
           FROM pre_registros WHERE folio = $1`,
        [folio]
      );
      return rows[0] ? mapRegistro(rows[0]) : null;
    },

    async eliminarRegistroPorFolio(folio) {
      const { rowCount } = await pool.query('DELETE FROM pre_registros WHERE folio = $1', [folio]);
      return rowCount > 0;
    },

    async existeFolio(folio) {
      const { rows } = await pool.query('SELECT 1 FROM pre_registros WHERE folio = $1', [folio]);
      return rows.length > 0;
    },

    async cerrar() {
      await pool.end();
    }
  };
}
