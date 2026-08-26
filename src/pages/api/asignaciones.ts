import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const { data, error } = await supabase
      .from('asignaciones')
      .select('*')
      .order('fecha_asignacion', { ascending: true });

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { territorio_id, persona, fecha_asignacion, fecha_completado } = body;

    if (!territorio_id || !persona || !fecha_asignacion) {
      return new Response(JSON.stringify({ error: 'Faltan campos requeridos' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data, error } = await supabase
      .from('asignaciones')
      .insert({ territorio_id, persona, fecha_asignacion, fecha_completado: fecha_completado || null })
      .select();

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { id, persona, fecha_asignacion, fecha_completado } = body;

    if (!id || !persona || !fecha_asignacion) {
      return new Response(JSON.stringify({ error: 'Faltan campos requeridos' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data, error } = await supabase
      .from('asignaciones')
      .update({ persona, fecha_asignacion, fecha_completado: fecha_completado || null })
      .eq('id', id)
      .select();

    if (error) throw error;

    return new Response(JSON.stringify(data), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return new Response(JSON.stringify({ error: 'ID requerido' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const { error } = await supabase
      .from('asignaciones')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};
