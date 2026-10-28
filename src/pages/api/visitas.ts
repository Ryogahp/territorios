import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';
import { TERRITORIOS_POR_NUMERO } from '../../lib/territorios';
import type { TerritorioVisita, Turno } from '../../lib/types';

export const prerender = false;

const TURNOS: Turno[] = ['Mañana', 'Tarde'];
const MAX_TERRITORIOS = 3;

interface CuerpoVisita {
  id?: unknown;
  fecha?: unknown;
  persona?: unknown;
  turno?: unknown;
  cantidad_personas?: unknown;
  territorios?: unknown;
}

interface DatosVisita {
  fecha: string;
  persona: string;
  turno: Turno;
  cantidad_personas: number | null;
  territorios: TerritorioVisita[];
}

type ResultadoDatos = { ok: true; datos: DatosVisita } | { ok: false; mensaje: string };
type ResultadoTerritorios =
  | { ok: true; territorios: TerritorioVisita[] }
  | { ok: false; mensaje: string };

function json(datos: unknown, estado = 200): Response {
  return new Response(JSON.stringify(datos), {
    status: estado,
    headers: { 'Content-Type': 'application/json' },
  });
}

function error(mensaje: string, estado = 400): Response {
  return json({ error: mensaje }, estado);
}

function mensajeDeError(valor: unknown): string {
  return valor instanceof Error ? valor.message : String(valor);
}

function errorInterno(valor: unknown): Response {
  console.error('[api/visitas]', valor);
  const mensaje = import.meta.env.DEV ? mensajeDeError(valor) : 'No se pudo completar la operación';
  return error(mensaje, 500);
}

async function leerCuerpo(request: Request): Promise<CuerpoVisita | null> {
  try {
    const datos: unknown = await request.json();
    return datos && typeof datos === 'object' ? (datos as CuerpoVisita) : null;
  } catch {
    return null;
  }
}

function esFechaValida(valor: unknown): valor is string {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;

  const fecha = new Date(`${valor}T00:00:00`);
  if (Number.isNaN(fecha.getTime())) return false;

  return (
    fecha.getFullYear() === Number(valor.slice(0, 4)) &&
    fecha.getMonth() + 1 === Number(valor.slice(5, 7)) &&
    fecha.getDate() === Number(valor.slice(8, 10))
  );
}

function esPersonaValida(valor: unknown): valor is string {
  return typeof valor === 'string' && valor.trim().length > 0 && valor.trim().length <= 120;
}

function esTurnoValido(valor: unknown): valor is Turno {
  return typeof valor === 'string' && TURNOS.includes(valor as Turno);
}

function esCantidadValida(valor: unknown): valor is number | null | undefined {
  return (
    valor === null ||
    valor === undefined ||
    (typeof valor === 'number' && Number.isInteger(valor) && valor > 0)
  );
}

function validarTerritorios(valor: unknown, maximo: number): ResultadoTerritorios {
  if (!Array.isArray(valor) || valor.length === 0) {
    return { ok: false, mensaje: 'Debes indicar al menos un territorio' };
  }
  if (valor.length > maximo) {
    return { ok: false, mensaje: `Máximo ${maximo} territorio${maximo > 1 ? 's' : ''} por visita` };
  }

  const territorios: TerritorioVisita[] = [];

  for (const elemento of valor) {
    if (!elemento || typeof elemento !== 'object') {
      return { ok: false, mensaje: 'Territorio inválido' };
    }

    const { territorio_id, cuadras } = elemento as Partial<TerritorioVisita>;
    if (typeof territorio_id !== 'number' || !Number.isInteger(territorio_id)) {
      return { ok: false, mensaje: 'El territorio indicado no es válido' };
    }

    const territorio = TERRITORIOS_POR_NUMERO.get(territorio_id);
    if (!territorio) {
      return { ok: false, mensaje: `El territorio ${territorio_id} no existe` };
    }

    if (!Array.isArray(cuadras) || cuadras.length === 0) {
      return {
        ok: false,
        mensaje: `El territorio ${territorio_id} debe tener al menos una cuadra`,
      };
    }

    const letras = new Set(territorio.letras);
    const invalidas = cuadras.filter(
      (cuadra) => typeof cuadra !== 'string' || !letras.has(cuadra),
    );
    if (invalidas.length > 0) {
      return {
        ok: false,
        mensaje: `Cuadras inválidas para el territorio ${territorio_id}: ${invalidas.join(', ')}`,
      };
    }

    territorios.push({
      territorio_id,
      cuadras: [...new Set(cuadras)],
    });
  }

  return { ok: true, territorios };
}

function validarCuerpo(cuerpo: CuerpoVisita, maximoTerritorios: number): ResultadoDatos {
  if (!esFechaValida(cuerpo.fecha)) {
    return { ok: false, mensaje: 'La fecha no es válida' };
  }
  if (!esPersonaValida(cuerpo.persona)) {
    return { ok: false, mensaje: 'La persona no es válida' };
  }
  if (!esTurnoValido(cuerpo.turno)) {
    return { ok: false, mensaje: 'El turno debe ser "Mañana" o "Tarde"' };
  }
  if (!esCantidadValida(cuerpo.cantidad_personas)) {
    return { ok: false, mensaje: 'La cantidad de personas debe ser un número positivo' };
  }

  const resultadoTerritorios = validarTerritorios(cuerpo.territorios, maximoTerritorios);
  if (!resultadoTerritorios.ok) {
    return { ok: false, mensaje: resultadoTerritorios.mensaje };
  }

  return {
    ok: true,
    datos: {
      fecha: cuerpo.fecha,
      persona: cuerpo.persona.trim(),
      turno: cuerpo.turno,
      cantidad_personas: cuerpo.cantidad_personas ?? null,
      territorios: resultadoTerritorios.territorios,
    },
  };
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const cuerpo = await leerCuerpo(request);
    if (!cuerpo) return error('El cuerpo de la petición no es un JSON válido');

    const validacion = validarCuerpo(cuerpo, MAX_TERRITORIOS);
    if (!validacion.ok) return error(validacion.mensaje);

    const { fecha, persona, turno, cantidad_personas, territorios } = validacion.datos;

    const inserts = territorios.map((territorio) => ({
      fecha,
      persona,
      turno,
      cantidad_personas,
      territorio_id: territorio.territorio_id,
      cuadras: territorio.cuadras,
    }));

    const { data, error: errorSupabase } = await supabase.from('visitas').insert(inserts).select();
    if (errorSupabase) throw errorSupabase;

    return json(data);
  } catch (valor) {
    return errorInterno(valor);
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const cuerpo = await leerCuerpo(request);
    if (!cuerpo) return error('El cuerpo de la petición no es un JSON válido');

    const id = Number(cuerpo.id);
    if (!Number.isInteger(id) || id <= 0) return error('El ID de la visita no es válido');

    const validacion = validarCuerpo(cuerpo, 1);
    if (!validacion.ok) return error(validacion.mensaje);

    const { fecha, persona, turno, cantidad_personas, territorios } = validacion.datos;
    const territorio = territorios[0];

    const { data, error: errorSupabase } = await supabase
      .from('visitas')
      .update({
        fecha,
        persona,
        turno,
        cantidad_personas,
        territorio_id: territorio.territorio_id,
        cuadras: territorio.cuadras,
      })
      .eq('id', id)
      .select()
      .single();

    if (errorSupabase) {
      if (errorSupabase.code === 'PGRST116') return error('Visita no encontrada', 404);
      throw errorSupabase;
    }

    return json(data);
  } catch (valor) {
    return errorInterno(valor);
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const cuerpo = await leerCuerpo(request);
    if (!cuerpo) return error('El cuerpo de la petición no es un JSON válido');

    const id = Number(cuerpo.id);
    if (!Number.isInteger(id) || id <= 0) return error('El ID de la visita no es válido');

    const { data, error: errorSupabase } = await supabase
      .from('visitas')
      .delete()
      .eq('id', id)
      .select('id');

    if (errorSupabase) throw errorSupabase;
    if (!data || data.length === 0) return error('Visita no encontrada', 404);

    return json({ success: true });
  } catch (valor) {
    return errorInterno(valor);
  }
};

export const GET: APIRoute = async ({ url }) => {
  try {
    const territorioParametro = url.searchParams.get('territorio_id');
    const territorioId = territorioParametro === null ? null : Number(territorioParametro);

    if (territorioId !== null && (!Number.isInteger(territorioId) || !TERRITORIOS_POR_NUMERO.has(territorioId))) {
      return error('El territorio indicado no es válido');
    }

    let consulta = supabase
      .from('visitas')
      .select('*')
      .order('fecha', { ascending: false })
      .order('id', { ascending: false });

    if (territorioId !== null) {
      consulta = consulta.eq('territorio_id', territorioId);
    }

    const { data, error: errorSupabase } = await consulta;
    if (errorSupabase) throw errorSupabase;

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (valor) {
    return errorInterno(valor);
  }
};
