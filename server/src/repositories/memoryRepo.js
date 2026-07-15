import crypto from 'node:crypto';

// Repositorio en memoria: misma interfaz que el repositorio de PostgreSQL.
// Los datos se pierden al reiniciar el proceso (usar SEED_MOCK=true para demos).

export function crearRepositorioMemoria() {
  const drafts = new Map();
  const registros = new Map(); // folio -> registro

  const ahora = () => new Date().toISOString();

  return {
    tipo: 'mock',

    async crearDraft() {
      const draft = {
        id: crypto.randomUUID(),
        faseActual: 0,
        datos: {},
        creadoEn: ahora(),
        actualizadoEn: ahora()
      };
      drafts.set(draft.id, draft);
      return structuredClone(draft);
    },

    async obtenerDraft(id) {
      const draft = drafts.get(id);
      return draft ? structuredClone(draft) : null;
    },

    async actualizarDraft(id, cambios) {
      const draft = drafts.get(id);
      if (!draft) return null;
      if (cambios.faseActual !== undefined) draft.faseActual = cambios.faseActual;
      if (cambios.datos !== undefined) draft.datos = structuredClone(cambios.datos);
      draft.actualizadoEn = ahora();
      return structuredClone(draft);
    },

    async eliminarDraft(id) {
      return drafts.delete(id);
    },

    async crearRegistro(registro) {
      const guardado = structuredClone({ ...registro, creadoEn: registro.creadoEn ?? ahora() });
      registros.set(guardado.folio, guardado);
      return structuredClone(guardado);
    },

    async obtenerRegistroPorFolio(folio) {
      const registro = registros.get(folio);
      return registro ? structuredClone(registro) : null;
    },

    async eliminarRegistroPorFolio(folio) {
      return registros.delete(folio);
    },

    async existeFolio(folio) {
      return registros.has(folio);
    },

    async cerrar() {
      // Nada que cerrar en memoria.
    }
  };
}
