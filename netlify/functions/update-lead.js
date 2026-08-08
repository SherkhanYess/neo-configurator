// Netlify Function: update-lead
// Updates a lead's pipeline stage in amoCRM
// POST /api/update-lead { leadId, stageId }

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  const AMO_DOMAIN     = process.env.AMO_DOMAIN;
  const AMO_LONG_TOKEN = process.env.AMO_LONG_TOKEN;

  if (!AMO_DOMAIN || !AMO_LONG_TOKEN) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfigured' }) };
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { leadId, stageId, note, city } = body;
  if (!leadId) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'leadId is required' }) };
  }

  const CITY_ENUMS = {
    'Алматы':       268607,
    'Астана':       268609,
    'Шымкент':      268611,
    'Актобе':       268613,
    'Актау':        268615,
    'Атырау':       284343,
    'Другой город': 284345,
  };

  const amoBase = `https://${AMO_DOMAIN}.amocrm.ru/api/v4`;
  const amoHdrs = {
    'Authorization': `Bearer ${AMO_LONG_TOKEN}`,
    'Content-Type': 'application/json',
  };

  try {
    // Build patch payload
    const patch = {};
    if (stageId) patch.status_id = stageId;
    if (city && CITY_ENUMS[city]) {
      patch.custom_fields_values = [
        { field_id: 409769, values: [{ enum_id: CITY_ENUMS[city] }] },
      ];
    }

    // Update lead
    const res = await fetch(`${amoBase}/leads/${leadId}`, {
      method: 'PATCH',
      headers: amoHdrs,
      body: JSON.stringify(patch),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('amoCRM update-lead error:', err);
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'amoCRM update failed', detail: err }) };
    }

    // Optionally add a note
    if (note) {
      await fetch(`${amoBase}/leads/${leadId}/notes`, {
        method: 'POST',
        headers: amoHdrs,
        body: JSON.stringify([{ note_type: 'common', params: { text: note } }]),
      }).catch((e) => console.warn('note failed:', e));
    }

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, leadId, stageId }) };
  } catch (err) {
    console.error('update-lead error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal error', detail: String(err) }) };
  }
};
