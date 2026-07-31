import type { APIRoute } from 'astro';
import { supabase } from '../../lib/supabase';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { fecha, persona, territorios } = body;

    if (!fecha || !persona || !territorios || !Array.isArray(territorios) || territorios.length === 0) {
      return new Response(JSON.stringify({ error: 'Faltan campos requeridos' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    if (territorios.length > 3) {
      return new Response(JSON.stringify({ error: 'Máximo 3 territorios por visita' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    for (const t of territorios) {
      if (!t.territorio_id || !t.cuadras || !Array.isArray(t.cuadras) || t.cuadras.length === 0) {
        return new Response(JSON.stringify({ error: 'Cada territorio debe tener territorio_id y cuadras' }), {
          status: 400, headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    const inserts = territorios.map(t => ({
      fecha,
      persona,
      territorio_id: t.territorio_id,
      cuadras: t.cuadras,
    }));

    const { data, error } = await supabase
      .from('visitas')
      .insert(inserts)
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
    const { id, fecha, persona, territorios } = body;

    if (!id || !fecha || !persona || !territorios || !Array.isArray(territorios) || territorios.length === 0) {
      return new Response(JSON.stringify({ error: 'Faltan campos requeridos' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    if (territorios.length > 1) {
      return new Response(JSON.stringify({ error: 'Solo se puede editar un territorio a la vez' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const t = territorios[0];
    if (!t.territorio_id || !t.cuadras || !Array.isArray(t.cuadras) || t.cuadras.length === 0) {
      return new Response(JSON.stringify({ error: 'territorio_id y cuadras requeridos' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const { data, error } = await supabase
      .from('visitas')
      .update({ fecha, persona, territorio_id: t.territorio_id, cuadras: t.cuadras })
      .eq('id', id)
      .select()
      .single();

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
      .from('visitas')
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

export const GET: APIRoute = async ({ url }) => {
  try {
    const territorioId = url.searchParams.get('territorio_id');

    let query = supabase
      .from('visitas')
      .select('*')
      .order('fecha', { ascending: false });

    if (territorioId) {
      query = query.eq('territorio_id', parseInt(territorioId));
    }

    const { data, error } = await query;

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
