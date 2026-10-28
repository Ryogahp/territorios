import { expandirCuadras } from '../../lib/cuadras';
import { formatearFecha, hoyISO, mesISO, nombreDiaSemana, nombreMes } from '../../lib/fechas';
import { construirProgramacionMes } from '../../lib/programar';
import type { Visita } from '../../lib/types';
import { escaparHtml, mostrarMensaje, porId } from '../dom';
import { suscribir, type EstadoVisitas } from '../store';

const mesInput = porId<HTMLInputElement>('mesProgramar');
const resumen = porId<HTMLDivElement>('resumenProgramar');
const contenedor = porId<HTMLDivElement>('programarContainer');
const mensaje = porId<HTMLParagraphElement>('programarMessage');

let visitas: Visita[] = [];

function render(): void {
  const mes = mesInput.value;
  if (!mes) {
    resumen.innerHTML = '';
    contenedor.innerHTML = '';
    return;
  }

  const { dias, resumen: datos } = construirProgramacionMes(visitas, mes, hoyISO());

  resumen.innerHTML = `
    <span class="badge bg-stone text-white">${nombreMes(mes)}: ${datos.totalDias} días</span>
    <span class="badge bg-green-100 text-green-800 ring-1 ring-green-300 dark:bg-green-500/15 dark:text-green-300 dark:ring-green-500/30">Con salida: ${datos.conSalida}</span>
    <span class="badge bg-amber-100 text-amber-800 ring-1 ring-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30">Sin salida: ${datos.sinSalida}</span>
    <span class="badge bg-slate-100 text-slate-700 ring-1 ring-slate-300 dark:bg-slate-500/15 dark:text-slate-300 dark:ring-slate-500/30">Por programar: ${datos.porProgramar}</span>
    <span class="badge bg-surface-3 text-ink-muted ring-1 ring-line">Salidas registradas: ${datos.totalSalidas}</span>`;

  const filas = dias
    .map((dia) => {
      const estado = dia.salidas.length
        ? '<span class="badge bg-green-100 text-green-800 ring-1 ring-green-300 dark:bg-green-500/15 dark:text-green-300 dark:ring-green-500/30">Con salida</span>'
        : dia.esFuturo
          ? '<span class="badge bg-slate-100 text-slate-700 ring-1 ring-slate-300 dark:bg-slate-500/15 dark:text-slate-300 dark:ring-slate-500/30">Por programar</span>'
          : '<span class="badge bg-amber-100 text-amber-800 ring-1 ring-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30">Sin salida</span>';

      const detalle = dia.salidas.length
        ? `<ul class="space-y-1">
            ${dia.salidas
              .map((salida) => {
                const cuadras = expandirCuadras(salida.cuadras).join(', ');
                return `<li class="text-xs">
                  <span class="font-semibold text-ink">T${salida.territorio_id}</span>
                  <span class="text-ink"> · ${escaparHtml(salida.persona)}</span>
                  <div class="text-[11px] text-ink-muted">
                    ${escaparHtml(salida.turno ?? '—')} · ${salida.cantidad_personas ?? '—'} pers.
                    ${cuadras ? ` · Cuadras: ${escaparHtml(cuadras)}` : ''}
                  </div>
                </li>`;
              })
              .join('')}
          </ul>`
        : '<span class="text-ink-subtle">—</span>';

      const claseFila = dia.esHoy
        ? 'bg-stone/5 ring-1 ring-inset ring-stone/30'
        : dia.esFinDeSemana
          ? 'bg-surface-2'
          : '';

      return `
        <tr class="${claseFila}">
          <td class="px-2 py-1.5 border-b border-line align-top whitespace-nowrap">
            <div class="font-semibold text-ink">${dia.fecha.slice(8, 10)}</div>
            <div class="text-[10px] text-ink-subtle">${formatearFecha(dia.fecha)}</div>
          </td>
          <td class="px-2 py-1.5 border-b border-line align-top text-sm whitespace-nowrap">
            ${nombreDiaSemana(dia.fecha)}${dia.esHoy ? ' <span class="text-[10px] font-semibold text-brand uppercase">Hoy</span>' : ''}
          </td>
          <td class="px-2 py-1.5 border-b border-line align-top">${estado}</td>
          <td class="px-2 py-1.5 border-b border-line align-top">${detalle}</td>
        </tr>`;
    })
    .join('');

  contenedor.innerHTML = `
    <table class="w-full border-collapse text-sm">
      <thead>
        <tr>
          <th class="px-2 py-2 text-left bg-stone text-white">Día</th>
          <th class="px-2 py-2 text-left bg-stone text-white">Día de la semana</th>
          <th class="px-2 py-2 text-left bg-stone text-white">Estado</th>
          <th class="px-2 py-2 text-left bg-stone text-white">Salidas registradas</th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
    </table>`;
}

function renderEstado(estado: EstadoVisitas): void {
  if (estado.error) {
    mostrarMensaje(mensaje, `No se pudo cargar el mes: ${estado.error}`, 'error');
  } else if (!estado.cargado) {
    mostrarMensaje(mensaje, 'Cargando programación del mes…', 'info');
    resumen.innerHTML = '';
    contenedor.innerHTML = '';
    return;
  } else {
    mostrarMensaje(mensaje, '', 'info');
  }

  visitas = estado.visitas;
  render();
}

mesInput.value = mesISO(new Date());
mesInput.addEventListener('change', render);
suscribir(renderEstado);
