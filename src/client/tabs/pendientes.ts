import { expandirCuadras } from '../../lib/cuadras';
import { calcularDias, formatearFecha } from '../../lib/fechas';
import { GRUPOS_TERRITORIOS, TERRITORIOS, TERRITORIOS_POR_NUMERO } from '../../lib/territorios';
import type { Visita } from '../../lib/types';
import { escaparHtml, porId } from '../dom';
import { suscribir, type EstadoVisitas } from '../store';

interface DatosTerritorio {
  visitadas: number;
  faltantes: string[];
  ultima: string;
}

const contenedor = porId<HTMLDivElement>('territoriosList');

function datosTerritorio(visitas: Visita[], numero: number): DatosTerritorio {
  const territorio = TERRITORIOS_POR_NUMERO.get(numero);
  if (!territorio) return { visitadas: 0, faltantes: [], ultima: '' };

  const visitasTerritorio = visitas.filter((visita) => visita.territorio_id === numero);
  const letrasVisitadas = new Set<string>();
  visitasTerritorio.forEach((visita) => {
    expandirCuadras(visita.cuadras).forEach((letra) => letrasVisitadas.add(letra));
  });

  const faltantes = territorio.letras.filter((letra) => !letrasVisitadas.has(letra));
  const ultima = visitasTerritorio
    .map((visita) => visita.fecha)
    .sort((a, b) => b.localeCompare(a))[0] ?? '';

  return {
    visitadas: territorio.letras.length - faltantes.length,
    faltantes,
    ultima,
  };
}

function render(visitas: Visita[]): void {
  const lista = TERRITORIOS.map((territorio) => ({
    territorio,
    datos: datosTerritorio(visitas, territorio.numero),
  }));

  // Los territorios que hace más tiempo que no se visitan van primero.
  lista.sort((a, b) => {
    if (!a.datos.ultima && !b.datos.ultima) return a.territorio.numero - b.territorio.numero;
    if (!a.datos.ultima) return -1;
    if (!b.datos.ultima) return 1;
    return a.datos.ultima.localeCompare(b.datos.ultima);
  });

  contenedor.innerHTML = GRUPOS_TERRITORIOS.map((grupo, indiceGrupo) => {
    const enGrupo = lista.filter(
      ({ territorio }) => territorio.numero >= grupo.desde && territorio.numero <= grupo.hasta,
    );

    const filas = enGrupo
      .map(({ territorio, datos }) => {
        const estado = datos.ultima
          ? `<span class="text-ink-muted">${formatearFecha(datos.ultima)}
              <span class="text-[10px] text-ink-muted">(${calcularDias(datos.ultima)}d)</span></span>`
          : '<span class="text-[10px] font-semibold text-autumn uppercase dark:text-red-300">Nunca</span>';

        const completado = datos.faltantes.length === 0;
        const claseFila = completado
          ? 'bg-green-50 dark:bg-green-500/10'
          : datos.ultima
            ? ''
            : 'bg-amber-50 dark:bg-amber-500/10';

        return `
          <tr class="${claseFila}">
            <td class="px-1.5 py-0.5 border-b border-line font-semibold text-xs text-center">T${territorio.numero}</td>
            <td class="px-1.5 py-0.5 border-b border-line text-[11px] whitespace-nowrap">${estado}</td>
            <td class="px-1.5 py-0.5 border-b border-line text-[11px] text-center">${datos.visitadas}/${territorio.letras.length}</td>
            <td class="px-1.5 py-0.5 border-b border-line text-[10px] ${completado ? 'text-green-700 dark:text-green-400' : 'text-autumn dark:text-red-300'}">
              ${completado ? 'Completo' : datos.faltantes.join(',') || '—'}
            </td>
          </tr>`;
      })
      .join('');

    return `
      <div class="grupo-territorios overflow-hidden rounded-lg bg-surface shadow-sm ring-1 ring-line">
        <h3 class="bg-stone px-2 py-1.5 text-xs font-bold tracking-wide text-white uppercase">
          G${indiceGrupo + 1} — ${grupo.nombre}
          <span class="font-normal opacity-80">(${grupo.desde}–${grupo.hasta})</span>
        </h3>
        <table class="w-full border-collapse">
          <tbody>${filas}</tbody>
        </table>
      </div>`;
  }).join('');
}

function renderEstado(estado: EstadoVisitas): void {
  if (estado.error) {
    contenedor.innerHTML = `<p class="text-sm text-ink-muted">No se pudieron cargar los territorios: ${escaparHtml(estado.error)}</p>`;
    return;
  }

  if (!estado.cargado) {
    contenedor.innerHTML = '<p class="text-sm text-ink-muted">Cargando territorios…</p>';
    return;
  }

  render(estado.visitas);
}

suscribir(renderEstado);
