import { expandirCuadras } from '../../lib/cuadras';
import {
  calcularDias,
  formatearFecha,
  hoyISO,
  mesISO,
  nombreDiaSemana,
  nombreMes,
} from '../../lib/fechas';
import {
  condicionesVacias,
  construirProgramacionMes,
  esZonaProgramacion,
  generarProgramacionAutomatica,
  MAX_DIAS_ANULADOS,
  normalizarCondiciones,
  OPCION_SIN_SALIDA,
  TURNOS_PROGRAMACION,
  ventanaProgramacion,
  type CondicionesProgramacion,
  type DiaProgramado,
} from '../../lib/programar';
import { TERRITORIOS_POR_NUMERO } from '../../lib/territorios';
import type { Turno, Visita } from '../../lib/types';
import { escaparHtml, mostrarMensaje, porId, qsa } from '../dom';
import { suscribir, type EstadoVisitas } from '../store';

const CLAVE_CONDICIONES = 'territorios:programar:condiciones:v1';

const mesInput = porId<HTMLInputElement>('mesProgramar');
const resumen = porId<HTMLDivElement>('resumenProgramar');
const contenedor = porId<HTMLDivElement>('programarContainer');
const mensaje = porId<HTMLParagraphElement>('programarMessage');
const aviso = porId<HTMLParagraphElement>('avisoProgramar');
const ventanaTexto = porId<HTMLParagraphElement>('ventanaProgramar');
const selectsCondicion = qsa<HTMLSelectElement>('[data-condicion]');
const diasAnuladosContenedor = porId<HTMLDivElement>('diasAnulados');
const agregarDiaBtn = porId<HTMLButtonElement>('agregarDiaAnulado');
const restablecerBtn = porId<HTMLButtonElement>('restablecerCondiciones');
const anuladosMensaje = porId<HTMLParagraphElement>('anuladosMessage');

let visitas: Visita[] = [];
let condiciones: CondicionesProgramacion = condicionesVacias();
let diasAnulados: string[] = [''];

interface CondicionesGuardadas {
  condiciones?: unknown;
  diasAnulados?: unknown;
}

function esFechaISO(valor: unknown): valor is string {
  return typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor);
}

function cargarCondiciones(): void {
  try {
    const crudo = localStorage.getItem(CLAVE_CONDICIONES);
    if (!crudo) return;

    const datos: unknown = JSON.parse(crudo);
    if (!datos || typeof datos !== 'object') return;

    const guardadas = datos as CondicionesGuardadas;
    condiciones = normalizarCondiciones(guardadas.condiciones);

    if (Array.isArray(guardadas.diasAnulados)) {
      const fechas = guardadas.diasAnulados.filter(esFechaISO).slice(0, MAX_DIAS_ANULADOS);
      if (fechas.length > 0) diasAnulados = fechas;
    }
  } catch {
    // Si el almacenamiento no está disponible, se usan las condiciones por defecto.
  }
}

function guardarCondiciones(): void {
  try {
    localStorage.setItem(CLAVE_CONDICIONES, JSON.stringify({ condiciones, diasAnulados }));
  } catch {
    // Si el almacenamiento no está disponible, los cambios solo duran la sesión.
  }
}

function diasAnuladosActivos(): string[] {
  return [...new Set(diasAnulados.filter(esFechaISO))];
}

function sincronizarSelects(): void {
  selectsCondicion.forEach((select) => {
    const turno = select.dataset.turno as Turno | undefined;
    const dia = Number(select.dataset.dia);
    if (!turno || !TURNOS_PROGRAMACION.includes(turno) || Number.isNaN(dia)) return;

    const valor = condiciones[turno][dia];
    select.value = valor;
    select.dataset.activa = String(valor !== OPCION_SIN_SALIDA);
  });
}

function renderDiasAnulados(): void {
  const ventana = ventanaProgramacion(hoyISO());

  diasAnuladosContenedor.innerHTML = diasAnulados
    .map(
      (dia, indice) => `
        <div class="flex items-center gap-2">
          <input
            type="date"
            class="input min-w-0 flex-1"
            data-dia-anulado="${indice}"
            value="${escaparHtml(dia)}"
            min="${ventana.desde}"
            max="${ventana.hasta}"
            aria-label="Día anulado ${indice + 1}"
          />
          ${
            diasAnulados.length > 1
              ? `<button
                  type="button"
                  class="inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-line text-lg leading-none text-ink-muted transition hover:bg-autumn/10 hover:text-autumn dark:hover:text-red-300"
                  data-quitar-anulado="${indice}"
                  aria-label="Quitar día anulado ${indice + 1}"
                >×</button>`
              : ''
          }
        </div>`,
    )
    .join('');

  const maximoAlcanzado = diasAnulados.length >= MAX_DIAS_ANULADOS;
  agregarDiaBtn.disabled = maximoAlcanzado;
  agregarDiaBtn.classList.toggle('cursor-not-allowed', maximoAlcanzado);
  agregarDiaBtn.classList.toggle('opacity-50', maximoAlcanzado);
}

function mostrarAviso(texto: string): void {
  aviso.textContent = texto;
  aviso.classList.toggle('hidden', texto.length === 0);
}

function detalleDia(dia: DiaProgramado, hoy: string): string {
  const bloques: string[] = [];

  if (dia.salidas.length > 0) {
    bloques.push(`
      <ul class="space-y-1">
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
      </ul>`);
  }

  if (dia.sugerencias.length > 0) {
    const separador = dia.salidas.length > 0 ? 'mt-2 border-t border-line pt-2' : '';
    bloques.push(`
      <ul class="space-y-1 ${separador}">
        ${dia.sugerencias
          .map((sugerencia) => {
            const territorio = TERRITORIOS_POR_NUMERO.get(sugerencia.territorioId);
            const cuadras = territorio?.letras.length ?? 0;
            let referencia: string;

            if (!sugerencia.ultimaVisita) {
              referencia = 'Sin visitas registradas';
            } else if (sugerencia.ultimaVisita > hoy) {
              referencia = `Ya programada para ${formatearFecha(sugerencia.ultimaVisita)}`;
            } else {
              referencia = `Última visita: ${formatearFecha(sugerencia.ultimaVisita)} (${calcularDias(sugerencia.ultimaVisita)} d)`;
            }

            return `<li class="text-xs">
              <span class="badge bg-brand/10 text-brand ring-1 ring-brand/30">Auto</span>
              <span class="font-semibold text-ink">T${sugerencia.territorioId}</span>
              <span class="text-ink"> · ${escaparHtml(sugerencia.zona)}</span>
              <div class="text-[11px] text-ink-muted">
                ${escaparHtml(sugerencia.turno)} · ${cuadras} cuadras · ${escaparHtml(referencia)}
              </div>
            </li>`;
          })
          .join('')}
      </ul>`);
  }

  return bloques.join('') || '<span class="text-ink-subtle">—</span>';
}

function render(): void {
  const mes = mesInput.value;
  if (!mes) {
    resumen.innerHTML = '';
    contenedor.innerHTML = '';
    mostrarAviso('');
    return;
  }

  const hoy = hoyISO();
  const anulados = diasAnuladosActivos();
  const { sugerencias, ventana } = generarProgramacionAutomatica(visitas, condiciones, {
    hoy,
    diasAnulados: anulados,
  });

  const { dias, resumen: datos } = construirProgramacionMes(visitas, mes, hoy, {
    sugerencias,
    diasAnulados: anulados,
  });

  ventanaTexto.textContent = `Programación automática: ${formatearFecha(ventana.desde)} a ${formatearFecha(ventana.hasta)} (2 meses). Después de esa fecha no se generan sugerencias.`;

  const hayCondiciones = TURNOS_PROGRAMACION.some((turno) =>
    Object.values(condiciones[turno]).some((valor) => valor !== OPCION_SIN_SALIDA),
  );
  const mesFueraDeVentana =
    mes < ventana.desde.slice(0, 7) || mes > ventana.hasta.slice(0, 7);

  if (mesFueraDeVentana) {
    mostrarAviso(
      `Este mes está fuera de la ventana de programación automática (${formatearFecha(ventana.desde)} a ${formatearFecha(ventana.hasta)}). No se generan sugerencias; solo se muestran las salidas registradas.`,
    );
  } else if (!hayCondiciones) {
    mostrarAviso(
      'Aún no hay condiciones configuradas. Elige al menos una zona en la tabla de Condiciones para generar la programación automática.',
    );
  } else {
    mostrarAviso('');
  }

  resumen.innerHTML = `
    <span class="badge bg-stone text-white">${nombreMes(mes)}: ${datos.totalDias} días</span>
    <span class="badge bg-green-100 text-green-800 ring-1 ring-green-300 dark:bg-green-500/15 dark:text-green-300 dark:ring-green-500/30">Con salida: ${datos.conSalida}</span>
    <span class="badge bg-brand/10 text-brand ring-1 ring-brand/30">Programado auto: ${datos.programados}</span>
    <span class="badge bg-slate-100 text-slate-700 ring-1 ring-slate-300 dark:bg-slate-500/15 dark:text-slate-300 dark:ring-slate-500/30">Por programar: ${datos.porProgramar}</span>
    <span class="badge bg-amber-100 text-amber-800 ring-1 ring-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30">Sin salida: ${datos.sinSalida}</span>
    ${
      datos.anulados > 0
        ? `<span class="badge bg-autumn/10 text-autumn ring-1 ring-autumn/30 dark:text-red-300 dark:ring-red-400/30">Anulados: ${datos.anulados}</span>`
        : ''
    }
    <span class="badge bg-surface-3 text-ink-muted ring-1 ring-line">Salidas registradas: ${datos.totalSalidas}</span>
    <span class="badge bg-surface-3 text-ink-muted ring-1 ring-line">Sugerencias: ${datos.totalSugerencias}</span>`;

  const filas = dias
    .map((dia) => {
      const estado = dia.salidas.length
        ? '<span class="badge bg-green-100 text-green-800 ring-1 ring-green-300 dark:bg-green-500/15 dark:text-green-300 dark:ring-green-500/30">Con salida</span>'
        : dia.anulado
          ? '<span class="badge bg-autumn/10 text-autumn ring-1 ring-autumn/30 dark:text-red-300 dark:ring-red-400/30">Anulado</span>'
          : dia.sugerencias.length
            ? '<span class="badge bg-brand/10 text-brand ring-1 ring-brand/30">Programado auto</span>'
            : dia.esFuturo
              ? '<span class="badge bg-slate-100 text-slate-700 ring-1 ring-slate-300 dark:bg-slate-500/15 dark:text-slate-300 dark:ring-slate-500/30">Por programar</span>'
              : '<span class="badge bg-amber-100 text-amber-800 ring-1 ring-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/30">Sin salida</span>';

      const claseFila = dia.esHoy
        ? 'bg-stone/5 ring-1 ring-inset ring-stone/30'
        : dia.anulado && dia.salidas.length === 0
          ? 'bg-amber-50/70 dark:bg-amber-500/5'
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
          <td class="px-2 py-1.5 border-b border-line align-top">${detalleDia(dia, hoy)}</td>
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
          <th class="px-2 py-2 text-left bg-stone text-white">Salidas registradas / automáticas</th>
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

selectsCondicion.forEach((select) => {
  select.addEventListener('change', () => {
    const turno = select.dataset.turno as Turno | undefined;
    const dia = Number(select.dataset.dia);
    if (!turno || !TURNOS_PROGRAMACION.includes(turno) || Number.isNaN(dia)) return;

    const valor = select.value;
    if (valor !== OPCION_SIN_SALIDA && !esZonaProgramacion(valor)) return;

    condiciones[turno][dia] = valor;
    select.dataset.activa = String(valor !== OPCION_SIN_SALIDA);
    guardarCondiciones();
    render();
  });
});

agregarDiaBtn.addEventListener('click', () => {
  if (diasAnulados.length >= MAX_DIAS_ANULADOS) return;

  diasAnulados.push('');
  guardarCondiciones();
  renderDiasAnulados();
  qsa<HTMLInputElement>('[data-dia-anulado]', diasAnuladosContenedor).at(-1)?.focus();
});

diasAnuladosContenedor.addEventListener('change', (evento) => {
  const input = (evento.target as HTMLElement).closest<HTMLInputElement>('[data-dia-anulado]');
  if (!input) return;

  const indice = Number(input.dataset.diaAnulado);
  if (Number.isNaN(indice) || indice < 0 || indice >= diasAnulados.length) return;

  diasAnulados[indice] = input.value;
  anuladosMensaje.textContent = '';
  guardarCondiciones();
  render();
});

diasAnuladosContenedor.addEventListener('click', (evento) => {
  const boton = (evento.target as HTMLElement).closest<HTMLButtonElement>('[data-quitar-anulado]');
  if (!boton) return;

  const indice = Number(boton.dataset.quitarAnulado);
  if (Number.isNaN(indice) || indice < 0 || indice >= diasAnulados.length) return;

  diasAnulados.splice(indice, 1);
  if (diasAnulados.length === 0) diasAnulados = [''];
  guardarCondiciones();
  renderDiasAnulados();
  render();
});

restablecerBtn.addEventListener('click', () => {
  if (!window.confirm('¿Restablecer todas las condiciones y los días anulados?')) return;

  condiciones = condicionesVacias();
  diasAnulados = [''];
  guardarCondiciones();
  sincronizarSelects();
  renderDiasAnulados();
  anuladosMensaje.textContent = '';
  render();
});

cargarCondiciones();
sincronizarSelects();
renderDiasAnulados();
mesInput.value = mesISO(new Date());
mesInput.addEventListener('change', render);
suscribir(renderEstado);
