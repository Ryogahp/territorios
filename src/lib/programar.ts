import { diasDelMes, rangoFechas, sumarMesesFecha } from './fechas';
import {
  GRUPOS_TERRITORIOS,
  TERRITORIOS_POR_NUMERO,
  territoriosDeZona,
  type ZonaProgramacion,
} from './territorios';
import type { Turno, Visita } from './types';

export const TURNOS_PROGRAMACION: Turno[] = ['Mañana', 'Tarde'];

/** Días de la semana en el orden en que se muestran: lunes primero. */
export const DIAS_SEMANA_PROGRAMACION = [1, 2, 3, 4, 5, 6, 0] as const;

export const OPCION_SIN_SALIDA = 'No salida' as const;
export type OpcionCondicion = ZonaProgramacion | typeof OPCION_SIN_SALIDA;

export type CondicionesProgramacion = Record<Turno, Record<number, OpcionCondicion>>;

/** La programación automática cubre los próximos dos meses. */
export const MESES_VENTANA = 2;
export const MAX_DIAS_ANULADOS = 6;
export const MAX_TERRITORIOS_ANULADOS = 10;

export interface VentanaProgramacion {
  desde: string;
  hasta: string;
}

export interface SugerenciaProgramada {
  fecha: string;
  turno: Turno;
  zona: ZonaProgramacion;
  territorioId: number;
  /** Última visita registrada del territorio, si existe. */
  ultimaVisita: string | null;
}

export interface DiaProgramado {
  fecha: string;
  diaSemana: number;
  esHoy: boolean;
  esFuturo: boolean;
  esFinDeSemana: boolean;
  anulado: boolean;
  salidas: Visita[];
  sugerencias: SugerenciaProgramada[];
}

export interface ResumenProgramacion {
  totalDias: number;
  conSalida: number;
  programados: number;
  porProgramar: number;
  sinSalida: number;
  anulados: number;
  totalSalidas: number;
  totalSugerencias: number;
}

export interface OpcionesGeneracion {
  hoy: string;
  meses?: number;
  diasAnulados?: string[];
  territoriosAnulados?: number[];
}

export function condicionesVacias(): CondicionesProgramacion {
  const porDia = (): Record<number, OpcionCondicion> => {
    const dias: Record<number, OpcionCondicion> = {};
    for (const dia of DIAS_SEMANA_PROGRAMACION) {
      dias[dia] = OPCION_SIN_SALIDA;
    }
    return dias;
  };

  return { Mañana: porDia(), Tarde: porDia() };
}

export function esZonaProgramacion(valor: unknown): valor is ZonaProgramacion {
  return GRUPOS_TERRITORIOS.some((grupo) => grupo.nombre === valor);
}

/** Valida y limita la lista de territorios que no deben programarse. */
export function normalizarTerritoriosAnulados(valor: unknown): number[] {
  if (!Array.isArray(valor)) return [];

  const numeros = valor.filter(
    (item): item is number =>
      typeof item === 'number' &&
      Number.isInteger(item) &&
      TERRITORIOS_POR_NUMERO.has(item),
  );

  return [...new Set(numeros)].slice(0, MAX_TERRITORIOS_ANULADOS);
}

/** Convierte datos guardados (por ejemplo, en localStorage) en condiciones válidas. */
export function normalizarCondiciones(valor: unknown): CondicionesProgramacion {
  const condiciones = condicionesVacias();
  if (!valor || typeof valor !== 'object') return condiciones;

  const datos = valor as Partial<Record<Turno, Record<string, unknown>>>;

  for (const turno of TURNOS_PROGRAMACION) {
    const porDia = datos[turno];
    if (!porDia || typeof porDia !== 'object') continue;

    for (const dia of DIAS_SEMANA_PROGRAMACION) {
      const opcion = porDia[String(dia)];
      if (opcion === OPCION_SIN_SALIDA || esZonaProgramacion(opcion)) {
        condiciones[turno][dia] = opcion;
      }
    }
  }

  return condiciones;
}

export function ventanaProgramacion(hoy: string, meses = MESES_VENTANA): VentanaProgramacion {
  return { desde: hoy, hasta: sumarMesesFecha(hoy, meses) };
}

function ultimaVisitaPorTerritorio(visitas: Visita[]): Map<number, string> {
  const ultimas = new Map<number, string>();

  for (const visita of visitas) {
    const anterior = ultimas.get(visita.territorio_id);
    if (!anterior || visita.fecha > anterior) {
      ultimas.set(visita.territorio_id, visita.fecha);
    }
  }

  return ultimas;
}

/**
 * Genera las salidas sugeridas para los próximos `meses` meses.
 *
 * Reglas:
 * - Solo se programan fechas desde `hoy` hasta `hoy + meses`, ambas incluidas.
 * - Se respetan las condiciones de día de la semana y turno.
 * - No se programan fechas anuladas ni fechas que ya tienen una visita registrada.
 * - No se programan los territorios incluidos en `territoriosAnulados`.
 * - Dentro de cada zona se elige el territorio con la última visita más antigua.
 * - Se evita repetir un territorio que ya tiene una visita o sugerencia en la misma
 *   fecha o en una fecha posterior; si no hay alternativa, se usa el más antiguo.
 */
export function generarProgramacionAutomatica(
  visitas: Visita[],
  condiciones: CondicionesProgramacion,
  opciones: OpcionesGeneracion,
): { sugerencias: SugerenciaProgramada[]; ventana: VentanaProgramacion } {
  const ventana = ventanaProgramacion(opciones.hoy, opciones.meses);
  const anulados = new Set(opciones.diasAnulados ?? []);
  const territoriosAnulados = new Set(opciones.territoriosAnulados ?? []);
  const fechasOcupadas = new Set(visitas.map((visita) => visita.fecha));
  const ultimaVisita = ultimaVisitaPorTerritorio(visitas);
  const ultimaAsignada = new Map(ultimaVisita);
  const sugerencias: SugerenciaProgramada[] = [];

  for (const fecha of rangoFechas(ventana.desde, ventana.hasta)) {
    if (anulados.has(fecha) || fechasOcupadas.has(fecha)) continue;

    const diaSemana = new Date(`${fecha}T00:00:00`).getDay();

    for (const turno of TURNOS_PROGRAMACION) {
      const zona = condiciones[turno]?.[diaSemana];
      if (!zona || zona === OPCION_SIN_SALIDA) continue;

      const territorios = territoriosDeZona(zona).filter(
        (territorio) => !territoriosAnulados.has(territorio.numero),
      );
      if (territorios.length === 0) continue;

      const disponibles = territorios.filter((territorio) => {
        const ultima = ultimaAsignada.get(territorio.numero) ?? '';
        return !ultima || ultima < fecha;
      });
      const candidatos = disponibles.length > 0 ? disponibles : territorios;

      let elegido = candidatos[0];
      let fechaElegida = ultimaAsignada.get(elegido.numero) ?? '';

      for (const territorio of candidatos.slice(1)) {
        const fechaTerritorio = ultimaAsignada.get(territorio.numero) ?? '';
        if (fechaTerritorio < fechaElegida) {
          elegido = territorio;
          fechaElegida = fechaTerritorio;
        }
      }

      sugerencias.push({
        fecha,
        turno,
        zona,
        territorioId: elegido.numero,
        ultimaVisita: ultimaVisita.get(elegido.numero) ?? null,
      });
      ultimaAsignada.set(elegido.numero, fecha);
    }
  }

  return { sugerencias, ventana };
}

/**
 * Construye la información que se muestra en la pestaña "Programar el mes".
 * `hoy` se recibe como parámetro para poder probar la función con fechas fijas.
 */
export function construirProgramacionMes(
  visitas: Visita[],
  mes: string,
  hoy: string,
  opciones: { sugerencias?: SugerenciaProgramada[]; diasAnulados?: string[] } = {},
): { dias: DiaProgramado[]; resumen: ResumenProgramacion } {
  const fechas = diasDelMes(mes);
  const porFecha = new Map<string, Visita[]>();
  const sugerenciasPorFecha = new Map<string, SugerenciaProgramada[]>();
  const anulados = new Set(opciones.diasAnulados ?? []);

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

  (opciones.sugerencias ?? [])
    .filter((sugerencia) => sugerencia.fecha.startsWith(mes))
    .forEach((sugerencia) => {
      const lista = sugerenciasPorFecha.get(sugerencia.fecha);
      if (lista) {
        lista.push(sugerencia);
      } else {
        sugerenciasPorFecha.set(sugerencia.fecha, [sugerencia]);
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
      anulado: anulados.has(fecha),
      salidas: porFecha.get(fecha) ?? [],
      sugerencias: sugerenciasPorFecha.get(fecha) ?? [],
    };
  });

  const conSalida = dias.filter((dia) => dia.salidas.length > 0);
  const anuladosDias = dias.filter((dia) => dia.anulado && dia.salidas.length === 0);
  const programados = dias.filter(
    (dia) => !dia.anulado && dia.salidas.length === 0 && dia.sugerencias.length > 0,
  );
  const porProgramar = dias.filter(
    (dia) =>
      dia.esFuturo &&
      !dia.anulado &&
      dia.salidas.length === 0 &&
      dia.sugerencias.length === 0,
  );
  const sinSalida = dias.filter(
    (dia) => !dia.esFuturo && !dia.anulado && dia.salidas.length === 0,
  );

  return {
    dias,
    resumen: {
      totalDias: fechas.length,
      conSalida: conSalida.length,
      programados: programados.length,
      porProgramar: porProgramar.length,
      sinSalida: sinSalida.length,
      anulados: anuladosDias.length,
      totalSalidas: dias.reduce((total, dia) => total + dia.salidas.length, 0),
      totalSugerencias: dias.reduce((total, dia) => total + dia.sugerencias.length, 0),
    },
  };
}
