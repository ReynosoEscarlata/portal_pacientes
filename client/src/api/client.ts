const BASE = '/api';

export interface DetalleValidacion {
  campo: string;
  mensaje: string;
}

export class ApiError extends Error {
  status: number;
  codigo: string;
  detalles: DetalleValidacion[];

  constructor(status: number, payload: any) {
    super(payload?.mensaje ?? 'Error de comunicación con el servidor');
    this.name = 'ApiError';
    this.status = status;
    this.codigo = payload?.error ?? 'DESCONOCIDO';
    this.detalles = Array.isArray(payload?.detalles) ? payload.detalles : [];
  }
}

async function pedir(ruta: string, opciones: RequestInit = {}): Promise<any> {
  const respuesta = await fetch(`${BASE}${ruta}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opciones
  });
  const cuerpo = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    throw new ApiError(respuesta.status, cuerpo);
  }
  return cuerpo;
}

export const api = {
  obtenerConfig: () => pedir('/phases'),
  crearBorrador: () => pedir('/registros/draft', { method: 'POST' }),
  obtenerBorrador: (id: string) => pedir(`/registros/draft/${id}`),
  guardarFase: (id: string, faseId: string, datos: unknown) =>
    pedir(`/registros/draft/${id}/fase/${faseId}`, {
      method: 'PUT',
      body: JSON.stringify({ datos })
    }),
  enviarRegistro: (id: string) => pedir(`/registros/draft/${id}/enviar`, { method: 'POST' }),
  arcoConsulta: (folio: string, fechaNacimiento: string) =>
    pedir('/arco/consulta', { method: 'POST', body: JSON.stringify({ folio, fechaNacimiento }) }),
  arcoEliminar: (folio: string, fechaNacimiento: string) =>
    pedir('/arco/eliminar', { method: 'POST', body: JSON.stringify({ folio, fechaNacimiento }) })
};
