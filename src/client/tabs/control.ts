import { expandirCuadras } from '../../lib/cuadras';
import { formatearFecha, isoFecha, nombreDiaSemana, nombreMes } from '../../lib/fechas';
import type { Visita } from '../../lib/types';
import { escaparHtml, mostrarMensaje, porId } from '../dom';
import { suscribir, type EstadoVisitas } from '../store';

const soloSinSalida = porId<HTMLInputElement>('soloSinSalida');
const resumenControl = porId<HTMLDivElement>('resumenControl');
const controlContainer = porId<HTMLDivElement>('controlContainer');
const mensaje = porId<HTMLParagraphElement>('controlMessage');

let visitas: Visita[] = [];

function render(): void {
  if (visitas.length === 0) {
    controlContainer.innerHTML = '<p class="text-sm text-ink-muted">No hay visitas registradas.</p>';
    resumenControl.innerHTML = '';
    return;
  }

  const porFecha = new Map<string, Visita[]>();
  visitas.forEach((visita) => {
    const lista = porFecha.get(visita.fecha);
    if (lista) {
      lista.push(visita);
    } else {
      porFecha.set(visita.fecha, [visita]);
    }
  });

  const fechas = [...porFecha.keys()].sort();
  const inicio = new Date(`${fechas[0]}T00:00:00`);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const dias: string[] = [];
  for (const fecha = new Date(inicio); fecha <= hoy; fecha.setDate(fecha.getDate() + 1)) {
    dias.push(isoFecha(fecha));
  }
  dias.sort().reverse();

  let conSalida = 0;
  let sinSalida = 0;
  dias.forEach((dia) => {
    if (porFecha.has(dia)) conSalida++;
    else sinSalida++;
  });

  resumenControl.innerHTML = `
    <span class="badge bg-stone text-white">Total de días: ${dias.length}</span>
    <span class="badge bg-green-100 text-green-800 ring-1 ring-green-300 dark:bg-green-500/15 dark:text-green-300 dark:ring-green-500/30">Días con salida: ${conSalida}</span>
    <span class="badge bg-amber-100 text-amber-800 ring-1 ring-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30">Días sin salida registrada: ${sinSalida}</span>`;

  const porMes = new Map<string, string[]>();
  dias.forEach((dia) => {
    if (soloSinSalida.checked && porFecha.has(dia)) return;
    const mes = dia.slice(0, 7);
    const lista = porMes.get(mes);
    if (lista) {
      lista.push(dia);
    } else {
      porMes.set(mes, [dia]);
    }
  });

  const meses = [...porMes.keys()].sort().reverse();

  controlContainer.innerHTML = meses
    .map((mes) => {
      const filas = (porMes.get(mes) ?? [])
        .map((dia) => {
          const salidas = porFecha.get(dia) ?? [];
          const celdaFecha = `
            <div class="font-semibold text-ink">${formatearFecha(dia)}</div>
            <div class="text-[10px] text-ink-muted">${nombreDiaSemana(dia)}</div>`;

          if (salidas.length === 0) {
            const esHoy = dia === isoFecha(hoy);
            return `
              <tr class="bg-amber-50 dark:bg-amber-500/10">
                <td class="px-2 py-1.5 border-b border-line align-top">${celdaFecha}</td>
                <td colspan="5" class="px-2 py-1.5 border-b border-line text-autumn italic text-xs dark:text-amber-300">
                  Sin salidas registradas${esHoy ? ' (hoy)' : ''} — posiblemente no anotaron
                </td>
              </tr>`;
          }

          return salidas
            .map(
              (salida, indice) => `
                <tr class="${indice % 2 ? 'bg-surface' : 'bg-surface-2'}">
                  ${indice === 0 ? `<td class="px-2 py-1.5 border-b border-line align-top" rowspan="${salidas.length}">${celdaFecha}</td>` : ''}
                  <td class="px-2 py-1.5 border-b border-line text-sm font-medium text-center whitespace-nowrap">T${salida.territorio_id}</td>
                  <td class="px-2 py-1.5 border-b border-line text-sm">${escaparHtml(salida.persona)}</td>
                  <td class="px-2 py-1.5 border-b border-line text-sm text-center whitespace-nowrap">${escaparHtml(salida.turno ?? '—')}</td>
                  <td class="px-2 py-1.5 border-b border-line text-sm text-center whitespace-nowrap">${Number(salida.cantidad_personas) || '—'}</td>
                  <td class="px-2 py-1.5 border-b border-line text-sm">${escaparHtml(expandirCuadras(salida.cuadras).join(', ')) || '—'}</td>
                </tr>`,
            )
            .join('');
        })
        .join('');

      return `
        <div class="overflow-hidden rounded-lg bg-surface shadow-sm ring-1 ring-line">
          <h3 class="bg-stone px-3 py-1.5 text-xs font-bold tracking-wide text-white uppercase">${nombreMes(mes)}</h3>
          <div class="overflow-x-auto">
            <table class="w-full border-collapse">
              <thead>
                <tr>
                  <th class="px-2 py-1 text-[10px] uppercase text-ink-muted text-left bg-surface-3 border-b border-line">Día</th>
                  <th class="px-2 py-1 text-[10px] uppercase text-ink-muted text-center bg-surface-3 border-b border-line">Territorio</th>
                  <th class="px-2 py-1 text-[10px] uppercase text-ink-muted text-left bg-surface-3 border-b border-line">Persona</th>
                  <th class="px-2 py-1 text-[10px] uppercase text-ink-muted text-center bg-surface-3 border-b border-line">Turno</th>
                  <th class="px-2 py-1 text-[10px] uppercase text-ink-muted text-center bg-surface-3 border-b border-line">N° pers</th>
                  <th class="px-2 py-1 text-[10px] uppercase text-ink-muted text-left bg-surface-3 border-b border-line">Cuadras</th>
                </tr>
              </thead>
              <tbody>${filas}</tbody>
            </table>
          </div>
        </div>`;
    })
    .join('');
}

function renderEstado(estado: EstadoVisitas): void {
  if (estado.error) {
    mostrarMensaje(mensaje, `No se pudo cargar el control de salidas: ${estado.error}`, 'error');
  } else if (!estado.cargado) {
    mostrarMensaje(mensaje, 'Cargando control de salidas…', 'info');
    controlContainer.innerHTML = '';
    resumenControl.innerHTML = '';
    return;
  } else {
    mostrarMensaje(mensaje, '', 'info');
  }

  visitas = estado.visitas;
  render();
}

soloSinSalida.addEventListener('change', render);
suscribir(renderEstado);
