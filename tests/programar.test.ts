import { describe, expect, it } from 'vitest';
import {
  condicionesVacias,
  construirProgramacionMes,
  generarProgramacionAutomatica,
  normalizarCondiciones,
  normalizarTerritoriosAnulados,
  type CondicionesProgramacion,
  type OpcionCondicion,
  type SugerenciaProgramada,
} from '../src/lib/programar';
import type { Turno, Visita } from '../src/lib/types';

function visita(
  id: number,
  fecha: string,
  territorio_id = 1,
  turno: Turno = 'Mañana',
): Visita {
  return {
    id,
    fecha,
    persona: 'Persona de prueba',
    turno,
    cantidad_personas: 1,
    territorio_id,
    cuadras: ['A'],
  };
}

function conZona(
  zona: OpcionCondicion,
  dia = 1,
  turno: Turno = 'Mañana',
): CondicionesProgramacion {
  const condiciones = condicionesVacias();
  condiciones[turno][dia] = zona;
  return condiciones;
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
      programados: 0,
      porProgramar: 16,
      sinSalida: 13,
      anulados: 0,
      totalSalidas: 2,
      totalSugerencias: 0,
    });
  });

  it('marca todos los días como pendientes en un mes futuro', () => {
    const { resumen } = construirProgramacionMes([], '2026-11', '2026-10-15');

    expect(resumen).toEqual({
      totalDias: 30,
      conSalida: 0,
      programados: 0,
      porProgramar: 30,
      sinSalida: 0,
      anulados: 0,
      totalSalidas: 0,
      totalSugerencias: 0,
    });
  });

  it('marca todos los días como sin salida en un mes pasado', () => {
    const { resumen } = construirProgramacionMes([], '2026-09', '2026-10-15');

    expect(resumen).toEqual({
      totalDias: 30,
      conSalida: 0,
      programados: 0,
      porProgramar: 0,
      sinSalida: 30,
      anulados: 0,
      totalSalidas: 0,
      totalSugerencias: 0,
    });
  });

  it('integra sugerencias y días anulados en el mes', () => {
    const sugerencias: SugerenciaProgramada[] = [
      {
        fecha: '2026-10-20',
        turno: 'Mañana',
        zona: 'Irpavi',
        territorioId: 1,
        ultimaVisita: null,
      },
      {
        fecha: '2026-10-21',
        turno: 'Tarde',
        zona: 'Irpavi',
        territorioId: 2,
        ultimaVisita: '2026-01-01',
      },
    ];

    const { dias, resumen } = construirProgramacionMes([], '2026-10', '2026-10-15', {
      sugerencias,
      diasAnulados: ['2026-10-22'],
    });

    expect(dias.find((dia) => dia.fecha === '2026-10-20')?.sugerencias).toHaveLength(1);
    expect(dias.find((dia) => dia.fecha === '2026-10-22')?.anulado).toBe(true);
    expect(resumen).toEqual({
      totalDias: 31,
      conSalida: 0,
      programados: 2,
      porProgramar: 13,
      sinSalida: 15,
      anulados: 1,
      totalSalidas: 0,
      totalSugerencias: 2,
    });
  });
});

describe('generación automática', () => {
  it('genera solo dentro de los próximos dos meses', () => {
    const { sugerencias, ventana } = generarProgramacionAutomatica(
      [],
      conZona('Irpavi', 1, 'Mañana'),
      { hoy: '2026-10-05' },
    );

    expect(ventana).toEqual({ desde: '2026-10-05', hasta: '2026-12-05' });
    expect(sugerencias[0]?.fecha).toBe('2026-10-05');
    expect(sugerencias.at(-1)?.fecha).toBe('2026-11-30');
    expect(sugerencias).toHaveLength(9);
    expect(sugerencias.every((sugerencia) => sugerencia.fecha <= '2026-12-05')).toBe(true);
  });

  it('no genera nada sin condiciones', () => {
    const { sugerencias } = generarProgramacionAutomatica([], condicionesVacias(), {
      hoy: '2026-10-05',
    });

    expect(sugerencias).toEqual([]);
  });

  it('respeta el día y el turno configurados', () => {
    const condiciones = condicionesVacias();
    condiciones['Tarde'][3] = 'Bella Vista';

    const { sugerencias } = generarProgramacionAutomatica([], condiciones, {
      hoy: '2026-10-05',
    });

    expect(sugerencias.length).toBeGreaterThan(0);
    expect(sugerencias.every((sugerencia) => sugerencia.turno === 'Tarde')).toBe(true);
    expect(sugerencias.every((sugerencia) => sugerencia.zona === 'Bella Vista')).toBe(true);
    expect(
      sugerencias.every(
        (sugerencia) => new Date(`${sugerencia.fecha}T00:00:00`).getDay() === 3,
      ),
    ).toBe(true);
  });

  it('omite días anulados y días con visitas registradas', () => {
    const { sugerencias } = generarProgramacionAutomatica(
      [visita(1, '2026-10-12', 3)],
      conZona('Irpavi', 1, 'Mañana'),
      { hoy: '2026-10-05', diasAnulados: ['2026-10-19'] },
    );

    const fechas = sugerencias.map((sugerencia) => sugerencia.fecha);
    expect(fechas).not.toContain('2026-10-12');
    expect(fechas).not.toContain('2026-10-19');
    expect(fechas).toContain('2026-10-05');
    expect(fechas).toContain('2026-10-26');
  });

  it('prioriza el territorio con la última visita más antigua y rota', () => {
    const { sugerencias } = generarProgramacionAutomatica(
      [
        visita(1, '2026-01-10', 47),
        visita(2, '2026-02-10', 48),
        visita(3, '2026-03-10', 49),
      ],
      conZona('Irpavi 2', 1, 'Mañana'),
      { hoy: '2026-10-05' },
    );

    expect(sugerencias.slice(0, 5).map((sugerencia) => sugerencia.territorioId)).toEqual([
      46, 47, 48, 49, 46,
    ]);
    expect(sugerencias[1]?.ultimaVisita).toBe('2026-01-10');
  });

  it('evita repetir un territorio que ya tiene una visita futura', () => {
    const { sugerencias } = generarProgramacionAutomatica(
      [visita(1, '2026-10-20', 1)],
      conZona('Irpavi', 1, 'Mañana'),
      { hoy: '2026-10-05' },
    );

    expect(sugerencias[0]?.territorioId).toBe(2);
  });

  it('omite los territorios anulados', () => {
    const { sugerencias } = generarProgramacionAutomatica(
      [],
      conZona('Irpavi 2', 1, 'Mañana'),
      { hoy: '2026-10-05', territoriosAnulados: [46, 47] },
    );

    expect(sugerencias[0]?.territorioId).toBe(48);
    expect(
      sugerencias.every(
        (sugerencia) => sugerencia.territorioId !== 46 && sugerencia.territorioId !== 47,
      ),
    ).toBe(true);
  });

  it('no genera salidas si todos los territorios de la zona están anulados', () => {
    const { sugerencias } = generarProgramacionAutomatica(
      [],
      conZona('Irpavi 2', 1, 'Mañana'),
      { hoy: '2026-10-05', territoriosAnulados: [46, 47, 48, 49] },
    );

    expect(sugerencias).toEqual([]);
  });

  it('normaliza y limita los territorios anulados', () => {
    expect(normalizarTerritoriosAnulados([1, 1, 60, 'x', 2.5, 3])).toEqual([1, 3]);
    expect(
      normalizarTerritoriosAnulados(Array.from({ length: 20 }, (_, indice) => indice + 1)),
    ).toHaveLength(10);
  });

  it('permite programar mañana y tarde el mismo día', () => {
    const condiciones = condicionesVacias();
    condiciones['Mañana'][1] = 'Irpavi';
    condiciones['Tarde'][1] = 'Bella Vista';

    const { sugerencias } = generarProgramacionAutomatica([], condiciones, {
      hoy: '2026-10-05',
    });

    expect(sugerencias[0]).toMatchObject({
      fecha: '2026-10-05',
      turno: 'Mañana',
      zona: 'Irpavi',
    });
    expect(sugerencias[1]).toMatchObject({
      fecha: '2026-10-05',
      turno: 'Tarde',
      zona: 'Bella Vista',
    });
  });

  it('ajusta el final de la ventana al último día del mes', () => {
    expect(
      generarProgramacionAutomatica([], condicionesVacias(), { hoy: '2026-12-31' }).ventana
        .hasta,
    ).toBe('2027-02-28');
  });

  it('normaliza condiciones guardadas y descarta valores inválidos', () => {
    const condiciones = normalizarCondiciones({
      Mañana: { 1: 'Irpavi', 2: 'Zona inventada' },
      Tarde: { 0: 'Alto Irpavi' },
    });

    expect(condiciones.Mañana[1]).toBe('Irpavi');
    expect(condiciones.Mañana[2]).toBe('No salida');
    expect(condiciones.Tarde[0]).toBe('Alto Irpavi');
    expect(condiciones.Tarde[6]).toBe('No salida');
  });
});
