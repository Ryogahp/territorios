export const TABS = [
  { id: 'registro', etiqueta: 'Registro' },
  { id: 'pendientes', etiqueta: 'Lista de territorios por visitar' },
  { id: 'asignaciones', etiqueta: 'S-13_S' },
  { id: 'control', etiqueta: 'Control de salidas' },
  { id: 'programar', etiqueta: 'Programar el mes' },
] as const;

export type TabId = (typeof TABS)[number]['id'];

export const TAB_POR_DEFECTO: TabId = 'registro';

export function esTabId(valor: string): valor is TabId {
  return TABS.some((tab) => tab.id === valor);
}
