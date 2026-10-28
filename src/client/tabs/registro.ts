import { ordenarUnicas } from '../../lib/cuadras';
import { formatearFecha } from '../../lib/fechas';
import { TERRITORIOS, TERRITORIOS_POR_NUMERO } from '../../lib/territorios';
import type { TerritorioVisita, Turno, Visita } from '../../lib/types';
import { escaparHtml, mostrarMensaje, porId, qs, qsa } from '../dom';
import {
  actualizarVisita,
  crearVisita,
  eliminarVisita,
  mensajeDeError,
  suscribir,
  type EstadoVisitas,
} from '../store';

const MAX_TERRITORIOS = 3;

const form = porId<HTMLFormElement>('visitaForm');
const fechaInput = porId<HTMLInputElement>('fecha');
const personaInput = porId<HTMLInputElement>('persona');
const turnoInput = porId<HTMLSelectElement>('turno');
const cantidadInput = porId<HTMLInputElement>('cantidadPersonas');
const territorioSelect = porId<HTMLSelectElement>('territorio');
const cuadrasCheckboxes = porId<HTMLDivElement>('cuadrasCheckboxes');
const addTerritorioBtn = porId<HTMLButtonElement>('addTerritorioBtn');
const submitBtn = porId<HTMLButtonElement>('submitBtn');
const cancelEditBtn = porId<HTMLButtonElement>('cancelEditBtn');
const formMessage = porId<HTMLParagraphElement>('formMessage');
const statusMessage = porId<HTMLParagraphElement>('statusMessage');
const tablaContainer = porId<HTMLDivElement>('tablaContainer');

let filasTerritorio = 1;
let editandoId: number | null = null;

function letrasDe(numero: number): string[] {
  return TERRITORIOS_POR_NUMERO.get(numero)?.letras ?? [];
}

/** Pinta los checkboxes de cuadras y mantiene actualizado el contador. */
function pintarCuadras(contenedor: HTMLElement, letras: string[], seleccionadas: string[] = []): void {
  contenedor.innerHTML = '';
  if (letras.length === 0) return;

  const seleccion = new Set(seleccionadas);

  const contador = document.createElement('div');
  contador.className = 'col-span-full mb-1 text-xs font-medium text-ink-muted';
  contenedor.appendChild(contador);

  const actualizarContador = (): void => {
    const total = contenedor.querySelectorAll<HTMLInputElement>('.cb-checkbox:checked').length;
    contador.textContent = `${total} seleccionadas de ${letras.length}`;
  };

  letras.forEach((letra) => {
    const label = document.createElement('label');
    label.className =
      'cb-label flex items-center gap-1.5 text-sm cursor-pointer rounded-md border border-mist/60 bg-surface px-2 py-1 transition-colors hover:bg-mist/10 has-checked:border-stone has-checked:bg-stone/10';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = letra;
    checkbox.className = 'cb-checkbox cursor-pointer';
    checkbox.checked = seleccion.has(letra);
    checkbox.addEventListener('change', actualizarContador);

    label.append(checkbox, document.createTextNode(letra));
    contenedor.appendChild(label);
  });

  actualizarContador();
}

function renderCuadrasPrincipal(seleccionadas: string[] = []): void {
  const numero = Number(territorioSelect.value);
  pintarCuadras(cuadrasCheckboxes, letrasDe(numero), seleccionadas);
}

function crearFilaTerritorio(): HTMLDivElement {
  const fila = document.createElement('div');
  fila.className = 'territorio-row rounded-lg bg-surface-2 p-3 ring-1 ring-mist/50';

  const cabecera = document.createElement('div');
  cabecera.className = 'row-header flex justify-between items-center mb-2';

  const etiqueta = document.createElement('span');
  etiqueta.className = 'row-label font-medium text-sm';

  const eliminarBtn = document.createElement('button');
  eliminarBtn.type = 'button';
  eliminarBtn.className =
    'remove-row bg-transparent border-none text-autumn cursor-pointer text-sm font-semibold hover:underline';
  eliminarBtn.textContent = '✕ Eliminar';

  cabecera.append(etiqueta, eliminarBtn);
  fila.appendChild(cabecera);

  const select = document.createElement('select');
  select.className = 'territorio-select input mb-2';
  select.innerHTML =
    '<option value="">Selecciona un territorio</option>' +
    TERRITORIOS.map(
      (territorio) =>
        `<option value="${territorio.numero}">Territorio ${territorio.numero} — ${territorio.letras.length} cuadras</option>`,
    ).join('');
  fila.appendChild(select);

  const checkboxes = document.createElement('div');
  checkboxes.className =
    'cuadras-checkboxes grid grid-cols-2 gap-2 rounded-lg border border-mist/50 bg-surface p-2 sm:grid-cols-3 lg:grid-cols-4';
  fila.appendChild(checkboxes);

  const pista = document.createElement('p');
  pista.className = 'select-hint mt-2 text-xs text-ink-muted';
  pista.textContent = 'Selecciona un territorio para ver sus cuadras.';
  fila.appendChild(pista);

  select.addEventListener('change', () => {
    const numero = Number(select.value);
    if (!numero) {
      checkboxes.innerHTML = '';
      pista.textContent = 'Selecciona un territorio para ver sus cuadras.';
      return;
    }
    pista.textContent = '';
    pintarCuadras(checkboxes, letrasDe(numero));
  });

  eliminarBtn.addEventListener('click', () => {
    fila.remove();
    filasTerritorio--;
    reetiquetarFilas();
    actualizarBotonAgregar();
  });

  return fila;
}

function reetiquetarFilas(): void {
  qsa<HTMLElement>('.row-label', form).forEach((etiqueta, indice) => {
    etiqueta.textContent = `Territorio ${indice + 1}`;
  });
}

function actualizarBotonAgregar(): void {
  addTerritorioBtn.hidden = editandoId !== null || filasTerritorio >= MAX_TERRITORIOS;
}

function recolectarTerritorios(): TerritorioVisita[] | null {
  const territorios: TerritorioVisita[] = [];

  const principalId = Number(territorioSelect.value);
  const principalCuadras = qsa<HTMLInputElement>('.cb-checkbox:checked', cuadrasCheckboxes).map(
    (checkbox) => checkbox.value,
  );
  if (principalId && principalCuadras.length > 0) {
    territorios.push({
      territorio_id: principalId,
      cuadras: ordenarUnicas(principalCuadras),
    });
  }

  qsa<HTMLElement>('.territorio-row', form).forEach((fila) => {
    const select = qs<HTMLSelectElement>('.territorio-select', fila);
    const seleccionadas = qsa<HTMLInputElement>('.cb-checkbox:checked', fila);
    if (!select.value || seleccionadas.length === 0) return;

    territorios.push({
      territorio_id: Number(select.value),
      cuadras: ordenarUnicas(seleccionadas.map((checkbox) => checkbox.value)),
    });
  });

  if (territorios.length === 0) {
    mostrarMensaje(formMessage, 'Selecciona al menos un territorio y sus cuadras.', 'error');
    return null;
  }
  if (territorios.length > MAX_TERRITORIOS) {
    mostrarMensaje(formMessage, `Máximo ${MAX_TERRITORIOS} territorios por persona y día.`, 'error');
    return null;
  }

  return territorios;
}

async function enviarVisita(evento: SubmitEvent): Promise<void> {
  evento.preventDefault();

  const territorios = recolectarTerritorios();
  if (!territorios) return;

  const fecha = fechaInput.value;
  const persona = personaInput.value.trim();
  const turno = turnoInput.value;
  const cantidad = cantidadInput.value ? Number.parseInt(cantidadInput.value, 10) : null;

  if (!fecha) {
    mostrarMensaje(formMessage, 'Debes indicar la fecha.', 'error');
    return;
  }
  if (!persona) {
    mostrarMensaje(formMessage, 'Debes indicar la persona.', 'error');
    return;
  }
  if (turno !== 'Mañana' && turno !== 'Tarde') {
    mostrarMensaje(formMessage, 'Debes indicar el turno (Mañana o Tarde).', 'error');
    return;
  }

  const estabaEditando = editandoId !== null;
  const payload = {
    fecha,
    persona,
    turno: turno as Turno,
    cantidad_personas: cantidad !== null && Number.isFinite(cantidad) ? cantidad : null,
    territorios,
  };

  submitBtn.disabled = true;

  try {
    if (editandoId !== null) {
      await actualizarVisita({ id: editandoId, ...payload });
    } else {
      await crearVisita(payload);
    }

    const cantidadTerritorios = territorios.length;
    const mensaje = estabaEditando
      ? 'Visita actualizada correctamente.'
      : `Visita${cantidadTerritorios > 1 ? 's' : ''} guardada${cantidadTerritorios > 1 ? 's' : ''} correctamente (${cantidadTerritorios} territorio${cantidadTerritorios > 1 ? 's' : ''}).`;

    cancelarEdicion();
    mostrarMensaje(formMessage, mensaje, 'exito');
  } catch (error) {
    mostrarMensaje(formMessage, mensajeDeError(error), 'error');
  } finally {
    submitBtn.disabled = false;
  }
}

function editarVisita(boton: HTMLButtonElement): void {
  editandoId = Number(boton.dataset.id);
  fechaInput.value = boton.dataset.fecha ?? '';
  personaInput.value = boton.dataset.persona ?? '';
  turnoInput.value = boton.dataset.turno ?? '';
  cantidadInput.value = boton.dataset.cantidad ?? '';
  territorioSelect.value = boton.dataset.territorio ?? '';

  qsa<HTMLElement>('.territorio-row', form).forEach((fila) => fila.remove());
  filasTerritorio = 1;

  let cuadras: string[] = [];
  try {
    const datos = JSON.parse(boton.dataset.cuadras ?? '[]') as unknown;
    if (Array.isArray(datos)) cuadras = datos.map((letra) => String(letra));
  } catch {
    // Si el atributo viene mal formado, se muestran las cuadras sin marcar.
  }

  renderCuadrasPrincipal(cuadras);
  submitBtn.textContent = 'Actualizar visita';
  cancelEditBtn.classList.remove('hidden');
  actualizarBotonAgregar();
  mostrarMensaje(formMessage, 'Editando visita. Cambia los datos y pulsa "Actualizar visita".', 'exito');
  form.scrollIntoView({ behavior: 'smooth' });
}

function cancelarEdicion(): void {
  editandoId = null;
  submitBtn.textContent = 'Guardar visita';
  cancelEditBtn.classList.add('hidden');
  form.reset();
  qsa<HTMLElement>('.territorio-row', form).forEach((fila) => fila.remove());
  filasTerritorio = 1;
  renderCuadrasPrincipal();
  actualizarBotonAgregar();
}

async function borrarVisita(id: number): Promise<void> {
  if (!confirm('¿Eliminar este registro de visita?')) return;

  try {
    await eliminarVisita(id);
  } catch (error) {
    mostrarMensaje(formMessage, mensajeDeError(error), 'error');
  }
}

function renderTabla(visitas: Visita[], error: string | null): void {
  const agrupado = new Map<number, Visita[]>();
  TERRITORIOS.forEach((territorio) => agrupado.set(territorio.numero, []));
  visitas.forEach((visita) => {
    agrupado.get(visita.territorio_id)?.push(visita);
  });

  const filas: string[] = [];
  const noVisitados: number[] = [];
  let conteo = 0;

  TERRITORIOS.forEach((territorio, indice) => {
    const visitasTerritorio = agrupado.get(territorio.numero) ?? [];
    if (visitasTerritorio.length === 0) noVisitados.push(territorio.numero);

    const grupo = indice % 2 === 0 ? 'grupoA' : 'grupoB';

    if (indice === 0) {
      filas.push(`
        <tr class="territorio-group ${grupo}">
          <td colspan="4" class="td-grupo px-2 py-1.5 border-b border-line bg-gradient-to-r from-[#cfe1ee] to-[#a9c8de] font-bold text-stone text-sm">
            Grupo A — Territorios 1 a 29
          </td>
        </tr>
      `);
    } else if (indice === 29) {
      filas.push(`
        <tr class="territorio-group ${grupo}">
          <td colspan="4" class="td-grupo px-2 py-1.5 border-b border-line bg-gradient-to-r from-[#e8dbc3] to-[#d8c094] font-bold text-stone text-sm">
            Grupo B — Territorios 30 a 59
          </td>
        </tr>
      `);
    }

    const detalleVisitas =
      visitasTerritorio
        .map((visita) => {
          const detalle =
            `${escaparHtml(visita.persona)} (${formatearFecha(visita.fecha)})` +
            (visita.turno ? ` — ${escaparHtml(visita.turno)}` : '') +
            (visita.cantidad_personas ? ` · ${visita.cantidad_personas} pers.` : '');
          const cuadras = escaparHtml(JSON.stringify(visita.cuadras));

          return `${detalle}
            <button class="btn-edit text-[11px] text-brand underline cursor-pointer border-none bg-transparent p-0 ml-1 hover:text-stone-dark dark:hover:text-white"
              data-id="${visita.id}" data-fecha="${escaparHtml(visita.fecha)}" data-persona="${escaparHtml(visita.persona)}"
              data-territorio="${visita.territorio_id}" data-turno="${escaparHtml(visita.turno ?? '')}"
              data-cantidad="${visita.cantidad_personas ?? ''}" data-cuadras="${cuadras}">Editar</button>
            <button class="btn-delete text-[11px] text-autumn underline cursor-pointer border-none bg-transparent p-0 ml-1"
              data-id="${visita.id}">Eliminar</button>`;
        })
        .join('<br/>') || '<span class="text-slate-400 italic">Sin visitas</span>';

    const detalleCuadras =
      visitasTerritorio
        .map((visita) =>
          escaparHtml(Array.isArray(visita.cuadras) ? visita.cuadras.join(', ') : visita.cuadras),
        )
        .join('<br/>') || '<span class="text-slate-400 italic">—</span>';

    filas.push(`
      <tr class="territorio-row-tabla ${grupo}">
        <td class="td-terr px-2 py-1.5 border-b border-line font-semibold text-sm text-center text-slate-800 bg-gradient-to-r ${indice % 2 === 0 ? 'from-[#d7e5f0] to-[#b9d4e6]' : 'from-[#f0ead9] to-[#e3d7b8]'}">
          Territorio ${territorio.numero}
        </td>
        <td class="px-2 py-1.5 border-b border-line ${indice % 2 === 0 ? 'bg-surface' : 'bg-surface-2'} hover:bg-mist/15 transition-colors">
          <strong>${visitasTerritorio.length}</strong>
        </td>
        <td class="px-2 py-1.5 border-b border-line ${indice % 2 === 0 ? 'bg-surface' : 'bg-surface-2'} hover:bg-mist/15 transition-colors">
          ${detalleVisitas}
        </td>
        <td class="px-2 py-1.5 border-b border-line ${indice % 2 === 0 ? 'bg-surface' : 'bg-surface-2'} hover:bg-mist/15 transition-colors">
          ${detalleCuadras}
        </td>
      </tr>
    `);

    conteo += visitasTerritorio.length;
  });

  tablaContainer.innerHTML = `
    <table class="w-full border-collapse text-sm">
      <thead>
        <tr>
          <th class="px-2 py-2 text-left bg-stone text-white sticky top-0">Territorio</th>
          <th class="px-2 py-2 text-center bg-stone text-white sticky top-0">#</th>
          <th class="px-2 py-2 text-left bg-stone text-white sticky top-0">Persona y fecha</th>
          <th class="px-2 py-2 text-left bg-stone text-white sticky top-0">Cuadras</th>
        </tr>
      </thead>
      <tbody>
        ${filas.join('')}
      </tbody>
    </table>
  `;

  if (error) {
    mostrarMensaje(statusMessage, `No se pudieron cargar las visitas: ${error}`, 'error');
    return;
  }

  const resumen =
    `Total de visitas registradas: ${conteo}. Territorios sin visitar: ` +
    (noVisitados.length > 0 ? noVisitados.join(', ') : 'ninguno');
  mostrarMensaje(statusMessage, resumen, 'exito');
}

function renderEstado(estado: EstadoVisitas): void {
  if (estado.error) {
    renderTabla(estado.visitas, estado.error);
    return;
  }

  if (!estado.cargado) {
    mostrarMensaje(statusMessage, 'Cargando visitas…', 'info');
    tablaContainer.innerHTML = '<p class="text-sm text-ink-muted">Cargando visitas…</p>';
    return;
  }

  renderTabla(estado.visitas, null);
}

// ---- Eventos ----
territorioSelect.addEventListener('change', () => renderCuadrasPrincipal());
cancelEditBtn.addEventListener('click', cancelarEdicion);
addTerritorioBtn.addEventListener('click', () => {
  if (filasTerritorio >= MAX_TERRITORIOS) return;
  filasTerritorio++;
  const fila = crearFilaTerritorio();
  form.insertBefore(fila, addTerritorioBtn);
  reetiquetarFilas();
  actualizarBotonAgregar();
});
form.addEventListener('submit', (evento) => void enviarVisita(evento));

tablaContainer.addEventListener('click', (evento) => {
  const objetivo = evento.target as HTMLElement;
  const editarBtn = objetivo.closest<HTMLButtonElement>('.btn-edit');
  if (editarBtn) {
    editarVisita(editarBtn);
    return;
  }

  const borrarBtn = objetivo.closest<HTMLButtonElement>('.btn-delete');
  if (borrarBtn?.dataset.id) {
    void borrarVisita(Number(borrarBtn.dataset.id));
  }
});

// ---- Inicialización ----
fechaInput.valueAsDate = new Date();
renderCuadrasPrincipal();
actualizarBotonAgregar();
suscribir(renderEstado);
