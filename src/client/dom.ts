/** Busca un elemento por su `id` y falla rápido si el marcado cambió. */
export function porId<T extends Element = HTMLElement>(id: string): T {
  const elemento = document.getElementById(id);
  if (!elemento) throw new Error(`No se encontró el elemento #${id}`);
  return elemento as unknown as T;
}

export function qs<T extends Element>(selector: string, raiz: ParentNode = document): T {
  const elemento = raiz.querySelector<T>(selector);
  if (!elemento) throw new Error(`No se encontró el elemento ${selector}`);
  return elemento;
}

export function qsa<T extends Element>(selector: string, raiz: ParentNode = document): T[] {
  return Array.from(raiz.querySelectorAll<T>(selector));
}

/** Escapa texto antes de insertarlo con `innerHTML`. */
export function escaparHtml(valor: unknown): string {
  return String(valor ?? '').replace(/[&<>"']/g, (caracter) => {
    const reemplazos: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return reemplazos[caracter] ?? caracter;
  });
}

export type TipoMensaje = 'error' | 'exito' | 'info';

const CLASES_MENSAJE: Record<TipoMensaje, string[]> = {
  error: ['text-autumn', 'dark:text-red-300'],
  exito: ['text-green-700', 'dark:text-green-400'],
  info: ['text-ink-muted'],
};

/** Muestra un mensaje de estado reutilizando las clases del tema. */
export function mostrarMensaje(elemento: HTMLElement, mensaje: string, tipo: TipoMensaje = 'info'): void {
  const todasLasClases = Object.values(CLASES_MENSAJE).flat();
  elemento.classList.remove(...todasLasClases);
  elemento.classList.add(...CLASES_MENSAJE[tipo]);
  elemento.textContent = mensaje;
}
