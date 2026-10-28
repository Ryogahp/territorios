import { describe, expect, it } from 'vitest';
import { construirProgramacionMes } from '../src/lib/programar';
import type { Visita } from '../src/lib/types';

function visita(id: number, fecha: string): Visita {
  return {
    id,
    fecha,
    persona: 'Persona de prueba',
    turno: 'Mañana',
    cantidad_personas: 1,
    territorio_id: 1,
    cuadras: ['A'],
  };
}

describe('programación del mes', () => {
  it('incluye todos los días del mes y cuenta las salidas', () => {
    const { dias, resumen } = construirProgramacionMes(
      [visita(1, '2026-10-01'), visita(2, '2026-10-02')],
      '2026-10',
      '2026-10-15',
    );

    expect(dias).toHaveLength(31);
    expect(dias[0].fecha).toBe('2026-10-01');
    expect(dias.at(-1)?.fecha).toBe('2026-10-31');
    expect(dias[0].salidas).toHaveLength(1);
    expect(dias[0].esFinDeSemana).toBe(false);
    expect(dias[2].esFinDeSemana).toBe(true); // 3 de octubre de 2026 es sábado
    expect(resumen).toEqual({
      totalDias: 31,
      conSalida: 2,
      sinSalida: 13,
      porProgramar: 16,
      totalSalidas: 2,
    });
  });

  it('marca todos los días como pendientes en un mes futuro', () => {
    const { resumen } = construirProgramacionMes([], '2026-11', '2026-10-15');

    expect(resumen).toEqual({
      totalDias: 30,
      conSalida: 0,
      sinSalida: 0,
      porProgramar: 30,
      totalSalidas: 0,
    });
  });

  it('marca todos los días como sin salida en un mes pasado', () => {
    const { resumen } = construirProgramacionMes([], '2026-09', '2026-10-15');

    expect(resumen).toEqual({
      totalDias: 30,
      conSalida: 0,
      sinSalida: 30,
      porProgramar: 0,
      totalSalidas: 0,
    });
  });
});
