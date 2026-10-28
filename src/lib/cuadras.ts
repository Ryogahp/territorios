/**
 * Convierte las cuadras a una lista de letras.
 * Acepta un array (`["A", "B"]`) o una cadena (`"A,C-E,H"`).
 */
export function expandirCuadras(cuadras: string[] | string | null | undefined): string[] {
  if (Array.isArray(cuadras)) {
    return cuadras.map((letra) => String(letra).toUpperCase());
  }
  if (!cuadras) return [];

  const lista: string[] = [];
  String(cuadras)
    .split(',')
    .forEach((parte) => {
      const coincidencia = parte.trim().match(/^([A-Za-z])(?:-([A-Za-z]))?$/);
      if (!coincidencia) return;

      let codigo = coincidencia[1].toUpperCase().charCodeAt(0);
      const fin = coincidencia[2] ? coincidencia[2].toUpperCase().charCodeAt(0) : codigo;
      for (; codigo <= fin; codigo++) {
        lista.push(String.fromCharCode(codigo));
      }
    });
  return lista;
}

/** Ordena y elimina duplicados de una lista de letras. */
export function ordenarUnicas(lista: string[]): string[] {
  return [...new Set(lista.map((letra) => String(letra).toUpperCase()))].sort();
}
