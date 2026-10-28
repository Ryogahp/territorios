import { expandirCuadras } from './cuadras';
import type { Visita } from './types';

export interface BloqueAsignacion {
  persona: string;
  inicio: string;
  /** Vacío cuando la persona no llegó a completar el territorio. */
  fin: string;
}

/**
 * Agrupa las visitas de un territorio en rondas.
 *
 * Una ronda termina cuando las cuadras acumuladas cubren todas las letras del
 * territorio; la siguiente visita inicia una ronda nueva. Dentro de cada ronda
 * se genera un bloque por persona.
 */
export function construirBloques(visitas: Visita[], letras: string[]): BloqueAsignacion[] {
  const todas = new Set(letras);
  const ordenadas = [...visitas].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const rondas: Visita[][] = [];
  let rondaActual: Visita[] = [];
  const acumulado = new Set<string>();

  for (const visita of ordenadas) {
    rondaActual.push(visita);
    expandirCuadras(visita.cuadras).forEach((letra) => acumulado.add(letra));

    const cubreTodo = [...todas].every((letra) => acumulado.has(letra));
    if (cubreTodo) {
      rondas.push(rondaActual);
      rondaActual = [];
      acumulado.clear();
    }
  }
  if (rondaActual.length > 0) rondas.push(rondaActual);

  const bloques: BloqueAsignacion[] = [];

  rondas.forEach((ronda, indiceRonda) => {
    const porPersona = new Map<string, Visita[]>();
    for (const visita of ronda) {
      const visitasPersona = porPersona.get(visita.persona);
      if (visitasPersona) {
        visitasPersona.push(visita);
      } else {
        porPersona.set(visita.persona, [visita]);
      }
    }

    const esUltimaRonda = indiceRonda === rondas.length - 1;
    let indicePersona = 0;

    for (const [persona, visitasPersona] of porPersona) {
      const inicio = visitasPersona[0].fecha;
      const acumuladoPersona = new Set<string>();
      let completado = '';

      for (const visita of visitasPersona) {
        expandirCuadras(visita.cuadras).forEach((letra) => acumuladoPersona.add(letra));
        if ([...todas].every((letra) => acumuladoPersona.has(letra))) {
          completado = visita.fecha;
        }
      }

      let fin = completado;
      if (!fin && esUltimaRonda && indicePersona === porPersona.size - 1) {
        // Bloque vigente: la última persona de la ronda en curso muestra hasta
        // la última fecha en la que trabajó, aunque le falten cuadras.
        fin = visitasPersona[visitasPersona.length - 1].fecha;
      }

      bloques.push({ persona, inicio, fin });
      indicePersona++;
    }
  });

  return bloques;
}

/**
 * Última fecha en la que las visitas anteriores al rango completaron todas las
 * cuadras del territorio. Devuelve una cadena vacía si nunca se completó.
 */
export function ultimaFechaCompletado(visitasPrevias: Visita[], letras: string[]): string {
  const todas = new Set(letras);
  const acumulado = new Set<string>();
  let ultima = '';

  for (const visita of [...visitasPrevias].sort((a, b) => a.fecha.localeCompare(b.fecha))) {
    expandirCuadras(visita.cuadras).forEach((letra) => acumulado.add(letra));
    if ([...todas].every((letra) => acumulado.has(letra))) {
      ultima = visita.fecha;
    }
  }

  return ultima;
}
