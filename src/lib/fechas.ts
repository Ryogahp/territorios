const NOMBRES_MES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export function pad2(numero: number): string {
  return String(numero).padStart(2, '0');
}

/** Convierte un objeto `Date` local a `YYYY-MM-DD`. */
export function isoFecha(fecha: Date): string {
  return `${fecha.getFullYear()}-${pad2(fecha.getMonth() + 1)}-${pad2(fecha.getDate())}`;
}

export function hoyISO(): string {
  return isoFecha(new Date());
}

/** Convierte `YYYY-MM-DD` a `dd/mm/aaaa`. */
export function formatearFecha(iso: string): string {
  const fecha = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(fecha.getTime())) return iso;
  return `${pad2(fecha.getDate())}/${pad2(fecha.getMonth() + 1)}/${fecha.getFullYear()}`;
}

/** Días transcurridos desde una fecha ISO hasta hoy. */
export function calcularDias(iso: string): number {
  const fecha = new Date(`${iso}T00:00:00`);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return Math.round((hoy.getTime() - fecha.getTime()) / 86_400_000);
}

/** Nombre del día de la semana para una fecha ISO. */
export function nombreDiaSemana(iso: string): string {
  return DIAS_SEMANA[new Date(`${iso}T00:00:00`).getDay()] ?? '';
}

/** Mes de una fecha local en formato `YYYY-MM`. */
export function mesISO(fecha: Date): string {
  return `${fecha.getFullYear()}-${pad2(fecha.getMonth() + 1)}`;
}

/** Suma (o resta) meses a un valor `YYYY-MM`. */
export function sumarMeses(iso: string, cantidad: number): string {
  const [anio, mes] = iso.split('-').map(Number);
  return mesISO(new Date(anio, mes - 1 + cantidad, 1));
}

export function primerDiaMes(iso: string): string {
  return `${iso}-01`;
}

export function ultimoDiaMes(iso: string): string {
  const [anio, mes] = iso.split('-').map(Number);
  return `${iso}-${pad2(new Date(anio, mes, 0).getDate())}`;
}

/** Nombre legible de un mes `YYYY-MM`, por ejemplo `"Octubre 2026"`. */
export function nombreMes(iso: string): string {
  const [anio, mes] = iso.split('-').map(Number);
  return `${NOMBRES_MES[mes - 1] ?? ''} ${anio}`;
}

/** Todas las fechas ISO de un mes `YYYY-MM`. */
export function diasDelMes(iso: string): string[] {
  const [anio, mes] = iso.split('-').map(Number);
  const total = new Date(anio, mes, 0).getDate();
  return Array.from({ length: total }, (_, indice) => `${iso}-${pad2(indice + 1)}`);
}
