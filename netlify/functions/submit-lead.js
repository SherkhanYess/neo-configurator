// Netlify Function: submit-lead
// Receives lead data from the configurator and creates a contact + deal in amoCRM

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const AMO_DOMAIN = process.env.AMO_DOMAIN;
  const AMO_LONG_TOKEN = process.env.AMO_LONG_TOKEN;

  if (!AMO_DOMAIN || !AMO_LONG_TOKEN) {
    console.error('Missing AMO_DOMAIN or AMO_LONG_TOKEN env vars');
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfigured' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { name, phone, occasion, timing, config = {}, configUrl = '', utm = {} } = body;

  if (!name || !phone) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'name and phone are required' }) };
  }

  const amoBase = `https://${AMO_DOMAIN}.amocrm.ru/api/v4`;
  const amoHeaders = {
    'Authorization': `Bearer ${AMO_LONG_TOKEN}`,
    'Content-Type': 'application/json',
  };

  try {
    // 1. Create contact
    const contactRes = await fetch(`${amoBase}/contacts`, {
      method: 'POST',
      headers: amoHeaders,
      body: JSON.stringify([
        {
          name,
          custom_fields_values: [
            {
              field_code: 'PHONE',
              values: [{ value: phone, enum_code: 'WORK' }],
            },
          ],
        },
      ]),
    });

    if (!contactRes.ok) {
      const err = await contactRes.text();
      console.error('amoCRM contact error:', err);
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'amoCRM contact failed', detail: err }) };
    }

    const contactData = await contactRes.json();
    const contactId = contactData?._embedded?.contacts?.[0]?.id;

    // 2. Build lead note text
    const configDesc = [
      config.shapeLabel && `Огранка: ${config.shapeLabel}`,
      config.shankLabel && `Шинка: ${config.shankLabel}`,
      config.castLabel  && `Каст: ${config.castLabel}`,
      config.carat      && `Каратность: ${config.carat} кар`,
      config.gem1Label  && `Центр. бриллиант: ${config.gem1Label}`,
      config.gem2Label  && `Россыпь: ${config.gem2Label}`,
      config.metalLabel && `Металл: ${config.metalLabel}`,
    ].filter(Boolean).join('\n');

    const utmDesc = Object.entries(utm)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');

    const noteText = [
      `📌 Повод: ${occasion || '—'}`,
      `⏰ Срок: ${timing || '—'}`,
      '',
      '💍 Конфигурация:',
      configDesc || '—',
      '',
      configUrl ? `🔗 Ссылка: ${configUrl}` : '',
      utmDesc   ? `📊 UTM: ${utmDesc}` : '',
    ].filter((l) => l !== undefined).join('\n').trim();

    // 3. Create lead
    const leadName = [
      'Кольцо',
      config.shapeLabel,
      config.carat ? `${config.carat}кар` : null,
      '—',
      name,
    ].filter(Boolean).join(' ');

    const leadPayload = [
      {
        name: leadName,
        ...(contactId ? { _embedded: { contacts: [{ id: contactId }] } } : {}),
      },
    ];

    const leadRes = await fetch(`${amoBase}/leads`, {
      method: 'POST',
      headers: amoHeaders,
      body: JSON.stringify(leadPayload),
    });

    if (!leadRes.ok) {
      const err = await leadRes.text();
      console.error('amoCRM lead error:', err);
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'amoCRM lead failed', detail: err }) };
    }

    const leadData = await leadRes.json();
    const leadId = leadData?._embedded?.leads?.[0]?.id;

    // 4. Add note to lead
    if (leadId && noteText) {
      await fetch(`${amoBase}/leads/${leadId}/notes`, {
        method: 'POST',
        headers: amoHeaders,
        body: JSON.stringify([{ note_type: 'common', params: { text: noteText } }]),
      }).catch((e) => console.warn('amoCRM note failed:', e));
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, leadId, contactId }),
    };
  } catch (err) {
    console.error('submit-lead error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal error', detail: String(err) }),
    };
  }
};
