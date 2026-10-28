import type { Visita, VisitaActualizadaPayload, VisitaPayload } from '../lib/types';

interface RespuestaError {
  error?: string;
}

async function solicitar<T>(url: string, opciones?: RequestInit): Promise<T> {
  const respuesta = await fetch(url, opciones);
  const datos = (await respuesta.json().catch(() => ({}))) as T & RespuestaError;

  if (!respuesta.ok) {
    throw new Error(datos.error || `Error HTTP ${respuesta.status}`);
  }

  return datos;
}

const CABECERAS_JSON = { 'Content-Type': 'application/json' };

export const apiVisitas = {
  listar(): Promise<Visita[]> {
    return solicitar<Visita[]>('/api/visitas');
  },

  crear(payload: VisitaPayload): Promise<Visita[]> {
    return solicitar<Visita[]>('/api/visitas', {
      method: 'POST',
      headers: CABECERAS_JSON,
      body: JSON.stringify(payload),
    });
  },

  actualizar(payload: VisitaActualizadaPayload): Promise<Visita> {
    return solicitar<Visita>('/api/visitas', {
      method: 'PUT',
      headers: CABECERAS_JSON,
      body: JSON.stringify(payload),
    });
  },

  eliminar(id: number): Promise<{ success: boolean }> {
    return solicitar<{ success: boolean }>('/api/visitas', {
      method: 'DELETE',
      headers: CABECERAS_JSON,
      body: JSON.stringify({ id }),
    });
  },
};
