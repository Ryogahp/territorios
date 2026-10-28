import { construirBloques, ultimaFechaCompletado, type BloqueAsignacion } from '../../lib/asignaciones';
import { formatearFecha, mesISO, primerDiaMes, sumarMeses, ultimoDiaMes } from '../../lib/fechas';
import { TERRITORIOS } from '../../lib/territorios';
import type { Visita } from '../../lib/types';
import { escaparHtml, mostrarMensaje, porId } from '../dom';
import { suscribir, type EstadoVisitas } from '../store';

const tabla = porId<HTMLDivElement>('tablaAsignaciones');
const mesInicioInput = porId<HTMLInputElement>('mesInicio');
const mesFinInput = porId<HTMLInputElement>('mesFin');
const mensaje = porId<HTMLParagraphElement>('asignacionesMessage');

// Fecha que se muestra cuando un territorio no tiene un completado anterior.
const FECHA_COMPLETADO_POR_DEFECTO = '2026-05-30';

let visitas: Visita[] = [];

function celdaVacia(): string {
  return '<span class="text-ink-subtle">&mdash;</span>';
}

function render(): void {
  const inicio = mesInicioInput.value;
  const fin = mesFinInput.value;
  if (!inicio || !fin) return;

  const [mesDesde, mesHasta] = inicio <= fin ? [inicio, fin] : [fin, inicio];
  const desde = primerDiaMes(mesDesde);
  const hasta = ultimoDiaMes(mesHasta);

  const bloquesPorTerritorio = new Map<number, BloqueAsignacion[]>();
  TERRITORIOS.forEach((territorio) => {
    const enRango = visitas.filter(
      (visita) =>
        visita.territorio_id === territorio.numero && visita.fecha >= desde && visita.fecha <= hasta,
    );
    bloquesPorTerritorio.set(territorio.numero, construirBloques(enRango, territorio.letras));
  });

  const nBloques = Math.max(
    4,
    ...[...bloquesPorTerritorio.values()].map((bloques) => bloques.length),
  );

  const filas = TERRITORIOS.map((territorio) => {
    const bloques = bloquesPorTerritorio.get(territorio.numero) ?? [];
    const visitasPrevias = visitas.filter(
      (visita) => visita.territorio_id === territorio.numero && visita.fecha < desde,
    );
    const ultima = ultimaFechaCompletado(visitasPrevias, territorio.letras);

    const filaNombres: string[] = [];
    const filaFechas: string[] = [];

    for (let indice = 0; indice < nBloques; indice++) {
      const bloque = bloques[indice];
      const separador = indice > 0 ? ' border-l-2 border-black' : '';

      if (!bloque) {
        filaNombres.push(
          `<td colspan="2" class="border-b border-line px-2 py-1 text-center${separador}">${celdaVacia()}</td>`,
        );
        filaFechas.push(
          `<td colspan="2" class="border-b border-line px-2 py-1 text-center${separador}">${celdaVacia()}</td>`,
        );
        continue;
      }

      filaNombres.push(
        `<td colspan="2" class="border-b border-line px-2 py-1 text-center font-medium text-sm${separador}">${escaparHtml(bloque.persona)}</td>`,
      );
      filaFechas.push(
        `<td class="border-b border-line px-2 py-1 text-xs text-center whitespace-nowrap${separador}">${formatearFecha(bloque.inicio)}</td>` +
          `<td class="border-b border-line px-2 py-1 text-xs text-center whitespace-nowrap">${
            bloque.fin ? formatearFecha(bloque.fin) : celdaVacia()
          }</td>`,
      );
    }

    const ultimaTexto = ultima
      ? formatearFecha(ultima)
      : formatearFecha(FECHA_COMPLETADO_POR_DEFECTO);

    return `
      <tr>
        <td rowspan="2" class="border-b border-line px-2 py-1 font-semibold text-center text-slate-800 bg-gradient-to-r from-[#d7e5f0] to-[#b9d4e6]">${territorio.numero}</td>
        <td rowspan="2" class="border-b border-line px-2 py-1 text-xs text-center bg-surface-2">${ultimaTexto}</td>
        ${filaNombres.join('')}
      </tr>
      <tr>${filaFechas.join('')}</tr>`;
  }).join('');

  const encabezadoNombres: string[] = [];
  const encabezadoFechas: string[] = [];

  for (let indice = 0; indice < nBloques; indice++) {
    const separador = indice > 0 ? ' border-l-2 border-black' : '';
    encabezadoNombres.push(
      `<th colspan="2" class="px-2 py-1 bg-stone text-white${separador}">Asignado a</th>`,
    );
    encabezadoFechas.push(
      `<th class="px-2 py-1 bg-stone text-white text-[11px] font-normal${separador}">Fecha que se asignó</th>` +
        `<th class="px-2 py-1 bg-stone text-white text-[11px] font-normal">Fecha que se completó</th>`,
    );
  }

  tabla.innerHTML = `
    <table class="w-full border-collapse text-sm">
      <thead>
        <tr>
          <th rowspan="2" class="px-2 py-2 bg-stone text-white min-w-[80px]">Número<br>de Territorio</th>
          <th rowspan="2" class="px-2 py-2 bg-stone text-white text-xs font-medium min-w-[100px]">Última fecha<br>completado</th>
          ${encabezadoNombres.join('')}
        </tr>
        <tr>${encabezadoFechas.join('')}</tr>
      </thead>
      <tbody>${filas}</tbody>
    </table>`;
}

function renderEstado(estado: EstadoVisitas): void {
  if (estado.error) {
    mostrarMensaje(mensaje, `No se pudo cargar el plan: ${estado.error}`, 'error');
  } else if (!estado.cargado) {
    mostrarMensaje(mensaje, 'Cargando plan de asignación…', 'info');
    tabla.innerHTML = '';
    return;
  } else {
    mostrarMensaje(mensaje, '', 'info');
  }

  visitas = estado.visitas;
  render();
}

mesFinInput.value = mesISO(new Date());
mesInicioInput.value = sumarMeses(mesFinInput.value, -3);

mesInicioInput.addEventListener('change', render);
mesFinInput.addEventListener('change', render);
suscribir(renderEstado);
