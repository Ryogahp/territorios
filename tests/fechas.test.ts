import { describe, expect, it } from 'vitest';
import {
  diasDelMes,
  formatearFecha,
  nombreDiaSemana,
  primerDiaMes,
  rangoFechas,
  sumarMeses,
  sumarMesesFecha,
  ultimoDiaMes,
} from '../src/lib/fechas';

describe('utilidades de fechas', () => {
  it('devuelve todos los días de un mes', () => {
    expect(diasDelMes('2026-02')).toHaveLength(28);
    expect(diasDelMes('2024-02')).toHaveLength(29);
    expect(diasDelMes('2026-10')).toHaveLength(31);
    expect(diasDelMes('2026-10')[0]).toBe('2026-10-01');
    expect(diasDelMes('2026-10').at(-1)).toBe('2026-10-31');
  });

  it('formatea fechas ISO como dd/mm/aaaa', () => {
    expect(formatearFecha('2026-10-28')).toBe('28/10/2026');
    expect(formatearFecha('2026-01-05')).toBe('05/01/2026');
  });

  it('obtiene el nombre del día de la semana', () => {
    expect(nombreDiaSemana('2026-10-28')).toBe('Miércoles');
    expect(nombreDiaSemana('2026-10-25')).toBe('Domingo');
  });

  it('suma y resta meses cruzando de año', () => {
    expect(sumarMeses('2026-01', -1)).toBe('2025-12');
    expect(sumarMeses('2026-12', 1)).toBe('2027-01');
    expect(sumarMeses('2026-10', 3)).toBe('2027-01');
  });

  it('calcula los límites del mes', () => {
    expect(primerDiaMes('2026-10')).toBe('2026-10-01');
    expect(ultimoDiaMes('2026-10')).toBe('2026-10-31');
    expect(ultimoDiaMes('2026-02')).toBe('2026-02-28');
  });

  it('suma meses a una fecha completa ajustando el día', () => {
    expect(sumarMesesFecha('2026-10-30', 2)).toBe('2026-12-30');
    expect(sumarMesesFecha('2026-01-31', 1)).toBe('2026-02-28');
    expect(sumarMesesFecha('2026-12-31', 2)).toBe('2027-02-28');
  });

  it('genera un rango de fechas inclusivo', () => {
    expect(rangoFechas('2026-10-30', '2026-11-02')).toEqual([
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
      '2026-11-02',
    ]);
    expect(rangoFechas('2026-11-02', '2026-10-30')).toEqual([]);
  });
});
