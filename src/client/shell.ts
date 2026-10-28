import { esTabId, TAB_POR_DEFECTO, type TabId } from '../lib/tabs';
import { porId, qsa } from './dom';

const botonesTab = qsa<HTMLButtonElement>('[data-tab]');
const paneles = qsa<HTMLElement>('[data-tab-panel]');

const menuBtn = porId<HTMLButtonElement>('menuBtn');
const mobileMenu = porId<HTMLDivElement>('mobileMenu');
const menuOverlay = porId<HTMLDivElement>('menuOverlay');
const menuSidebar = porId<HTMLElement>('menuSidebar');

function abrirMenu(): void {
  mobileMenu.classList.remove('hidden');
  requestAnimationFrame(() => menuSidebar.classList.remove('-translate-x-full'));
}

export function cerrarMenu(): void {
  menuSidebar.classList.add('-translate-x-full');
  setTimeout(() => mobileMenu.classList.add('hidden'), 300);
}

/** Activa una pestaña y muestra únicamente su panel. */
export function activarTab(id: TabId, actualizarHash = true): void {
  botonesTab.forEach((boton) => {
    boton.classList.toggle('active', boton.dataset.tab === id);
  });

  paneles.forEach((panel) => {
    panel.classList.toggle('hidden', panel.dataset.tabPanel !== id);
  });

  if (actualizarHash) {
    history.replaceState(null, '', `#${id}`);
  }

  cerrarMenu();
  document.dispatchEvent(new CustomEvent('tab:cambiar', { detail: { id } }));
}

botonesTab.forEach((boton) => {
  boton.addEventListener('click', () => {
    const id = boton.dataset.tab;
    if (id && esTabId(id)) activarTab(id);
  });
});

menuBtn.addEventListener('click', abrirMenu);
menuOverlay.addEventListener('click', cerrarMenu);

document.addEventListener('keydown', (evento) => {
  if (evento.key === 'Escape') cerrarMenu();
});

window.addEventListener('hashchange', () => {
  const id = location.hash.replace('#', '');
  if (esTabId(id)) activarTab(id, false);
});

// ---- Tema claro/oscuro ----
const themeBtn = porId<HTMLButtonElement>('themeBtn');
const iconMoon = porId<Element>('iconMoon');
const iconSun = porId<Element>('iconSun');

function aplicarTema(oscuro: boolean): void {
  document.documentElement.classList.toggle('dark', oscuro);
  iconMoon.classList.toggle('hidden', oscuro);
  iconSun.classList.toggle('hidden', !oscuro);
}

themeBtn.addEventListener('click', () => {
  const oscuro = !document.documentElement.classList.contains('dark');
  try {
    localStorage.setItem('theme', oscuro ? 'dark' : 'light');
  } catch {
    // Si localStorage no está disponible, el tema solo dura la sesión.
  }
  aplicarTema(oscuro);
});

aplicarTema(document.documentElement.classList.contains('dark'));

// ---- Pestaña inicial: hash de la URL o la pestaña por defecto ----
const hash = location.hash.replace('#', '');
activarTab(esTabId(hash) ? hash : TAB_POR_DEFECTO, false);
