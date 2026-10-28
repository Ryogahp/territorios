import { describe, expect, it } from 'vitest';
import { construirBloques, ultimaFechaCompletado } from '../src/lib/asignaciones';
import type { Visita } from '../src/lib/types';

function visita(id: number, fecha: string, persona: string, cuadras: string[]): Visita {
  return {
    id,
    fecha,
    persona,
    turno: 'Mañana',
    cantidad_personas: 1,
    territorio_id: 1,
    cuadras,
  };
}

describe('cálculo de asignaciones', () => {
  it('cierra una ronda cuando se cubren todas las cuadras', () => {
    const bloques = construirBloques(
      [
        visita(1, '2026-01-01', 'P1', ['A']),
        visita(2, '2026-01-02', 'P1', ['B']),
        visita(3, '2026-01-03', 'P2', ['A']),
      ],
      ['A', 'B'],
    );

    expect(bloques).toEqual([
      { persona: 'P1', inicio: '2026-01-01', fin: '2026-01-02' },
      { persona: 'P2', inicio: '2026-01-03', fin: '2026-01-03' },
    ]);
  });

  it('ordena las visitas por fecha antes de agrupar', () => {
    const bloques = construirBloques(
      [
        visita(2, '2026-01-02', 'P1', ['B']),
        visita(1, '2026-01-01', 'P1', ['A']),
      ],
      ['A', 'B'],
    );

    expect(bloques).toEqual([{ persona: 'P1', inicio: '2026-01-01', fin: '2026-01-02' }]);
  });

  it('calcula la última fecha en la que se completó el territorio', () => {
    expect(
      ultimaFechaCompletado(
        [
          visita(1, '2025-12-01', 'P1', ['A']),
          visita(2, '2025-12-02', 'P2', ['B']),
          visita(3, '2025-12-03', 'P3', ['A']),
        ],
        ['A', 'B'],
      ),
    ).toBe('2025-12-03');

    expect(ultimaFechaCompletado([visita(1, '2025-12-01', 'P1', ['A'])], ['A', 'B'])).toBe('');
  });
});
