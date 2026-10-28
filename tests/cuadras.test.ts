import { describe, expect, it } from 'vitest';
import { expandirCuadras, ordenarUnicas } from '../src/lib/cuadras';

describe('utilidades de cuadras', () => {
  it('expande rangos y listas separadas por comas', () => {
    expect(expandirCuadras('A,C-E,H')).toEqual(['A', 'C', 'D', 'E', 'H']);
    expect(expandirCuadras('a,b-c')).toEqual(['A', 'B', 'C']);
  });

  it('normaliza arrays a mayúsculas', () => {
    expect(expandirCuadras(['b', 'a'])).toEqual(['B', 'A']);
  });

  it('devuelve una lista vacía para valores vacíos', () => {
    expect(expandirCuadras(null)).toEqual([]);
    expect(expandirCuadras(undefined)).toEqual([]);
    expect(expandirCuadras('')).toEqual([]);
  });

  it('ordena y elimina duplicados', () => {
    expect(ordenarUnicas(['B', 'A', 'B', 'C'])).toEqual(['A', 'B', 'C']);
    expect(ordenarUnicas(['a', 'A'])).toEqual(['A']);
  });
});
