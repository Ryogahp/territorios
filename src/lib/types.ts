export type Turno = 'Mañana' | 'Tarde';

export interface Territorio {
  numero: number;
  letras: string[];
}

export interface Visita {
  id: number;
  /** Fecha en formato ISO `YYYY-MM-DD`. */
  fecha: string;
  persona: string;
  turno: Turno | null;
  cantidad_personas: number | null;
  territorio_id: number;
  /** La base de datos puede devolver un array o una cadena tipo `"A,C-E,H"`. */
  cuadras: string[] | string;
  created_at?: string;
}

export interface TerritorioVisita {
  territorio_id: number;
  cuadras: string[];
}

export interface VisitaPayload {
  fecha: string;
  persona: string;
  turno: Turno;
  cantidad_personas: number | null;
  territorios: TerritorioVisita[];
}

export interface VisitaActualizadaPayload extends VisitaPayload {
  id: number;
}
