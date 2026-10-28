import type { Visita, VisitaActualizadaPayload, VisitaPayload } from '../lib/types';
import { apiVisitas } from './api';

export interface EstadoVisitas {
  visitas: Visita[];
  cargando: boolean;
  error: string | null;
  cargado: boolean;
}

type Oyente = (estado: EstadoVisitas) => void;

let estado: EstadoVisitas = {
  visitas: [],
  cargando: false,
  error: null,
  cargado: false,
};

const oyentes = new Set<Oyente>();
let cargaEnCurso: Promise<void> | null = null;

function emitir(): void {
  oyentes.forEach((oyente) => oyente(estado));
}

export function mensajeDeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** Estado actual de las visitas. */
export function obtenerEstado(): EstadoVisitas {
  return estado;
}

/**
 * Registra un oyente y lanza la primera carga de datos de forma diferida.
 * Devuelve una función para cancelar la suscripción.
 */
export function suscribir(oyente: Oyente): () => void {
  oyentes.add(oyente);
  oyente(estado);
  void asegurarCarga();

  return () => {
    oyentes.delete(oyente);
  };
}

/** Vuelve a pedir todas las visitas al servidor. */
export async function recargar(): Promise<void> {
  estado = { ...estado, cargando: true, error: null };
  emitir();

  try {
    const visitas = await apiVisitas.listar();
    estado = { visitas, cargando: false, error: null, cargado: true };
  } catch (error) {
    estado = {
      ...estado,
      cargando: false,
      error: mensajeDeError(error),
      cargado: false,
    };
  }

  emitir();
}

function asegurarCarga(): Promise<void> {
  if (estado.cargado) return Promise.resolve();

  if (!cargaEnCurso) {
    cargaEnCurso = recargar().finally(() => {
      cargaEnCurso = null;
    });
  }

  return cargaEnCurso;
}

export async function crearVisita(payload: VisitaPayload): Promise<void> {
  await apiVisitas.crear(payload);
  await recargar();
}

export async function actualizarVisita(payload: VisitaActualizadaPayload): Promise<void> {
  await apiVisitas.actualizar(payload);
  await recargar();
}

export async function eliminarVisita(id: number): Promise<void> {
  await apiVisitas.eliminar(id);
  await recargar();
}
