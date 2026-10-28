import { diasDelMes } from './fechas';
import type { Visita } from './types';

export interface DiaProgramado {
  fecha: string;
  diaSemana: number;
  esHoy: boolean;
  esFuturo: boolean;
  esFinDeSemana: boolean;
  salidas: Visita[];
}

export interface ResumenProgramacion {
  totalDias: number;
  conSalida: number;
  sinSalida: number;
  porProgramar: number;
  totalSalidas: number;
}

/**
 * Construye la información que se muestra en la pestaña "Programar el mes".
 * `hoy` se recibe como parámetro para poder probar la función con fechas fijas.
 */
export function construirProgramacionMes(
  visitas: Visita[],
  mes: string,
  hoy: string,
): { dias: DiaProgramado[]; resumen: ResumenProgramacion } {
  const fechas = diasDelMes(mes);
  const porFecha = new Map<string, Visita[]>();

  visitas
    .filter((visita) => visita.fecha.startsWith(mes))
    .forEach((visita) => {
      const lista = porFecha.get(visita.fecha);
      if (lista) {
        lista.push(visita);
      } else {
        porFecha.set(visita.fecha, [visita]);
      }
    });

  const dias = fechas.map((fecha) => {
    const diaSemana = new Date(`${fecha}T00:00:00`).getDay();
    return {
      fecha,
      diaSemana,
      esHoy: fecha === hoy,
      esFuturo: fecha > hoy,
      esFinDeSemana: diaSemana === 0 || diaSemana === 6,
      salidas: porFecha.get(fecha) ?? [],
    };
  });

  return {
    dias,
    resumen: {
      totalDias: fechas.length,
      conSalida: dias.filter((dia) => dia.salidas.length > 0).length,
      sinSalida: dias.filter((dia) => dia.fecha <= hoy && dia.salidas.length === 0).length,
      porProgramar: dias.filter((dia) => dia.esFuturo).length,
      totalSalidas: dias.reduce((total, dia) => total + dia.salidas.length, 0),
    },
  };
}
