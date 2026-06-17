// Netlify Function: submit-lead
// Creates a contact + lead in amoCRM with all form fields mapped to CRM custom fields

// Module-level cache for custom fields (lives for the duration of the function instance)
let _fieldsCache = null;

async function getLeadFields(amoBase, amoHeaders) {
  if (_fieldsCache) return _fieldsCache;
  const res = await fetch(`${amoBase}/leads/custom_fields`, { headers: amoHeaders });
  if (!res.ok) return [];
  const data = await res.json();
  _fieldsCache = data._embedded?.custom_fields ?? [];
  return _fieldsCache;
}

function buildCustomFields(fields, { occasion, timing, city, utm = {} }) {
  const result = [];

  const findField = (name) =>
    fields.find((f) => f.name.toLowerCase().includes(name.toLowerCase()));

  const enumId = (field, value) =>
    field?.values?.find((v) => v.value === value)?.enum_id;

  const whenField      = findField('Когда нужно');
  const occasionField  = findField('Повод покупки');
  const cityField      = findField('Город заказа');
  const utmIdField     = findField('UTM_ID');
  const tranIdField    = findField('TRANID');
  const utmSourceField    = findField('utm_source');
  const utmMediumField    = findField('utm_medium');
  const utmCampaignField  = findField('utm_campaign');
  const utmContentField   = findField('utm_content');
  const utmTermField      = findField('utm_term');

  if (whenField && timing) {
    const eId = enumId(whenField, timing);
    if (eId) result.push({ field_id: whenField.id, values: [{ enum_id: eId }] });
  }
  if (occasionField && occasion) {
    const eId = enumId(occasionField, occasion);
    if (eId) result.push({ field_id: occasionField.id, values: [{ enum_id: eId }] });
  }
  if (cityField && city) {
    const eId = enumId(cityField, city);
    if (eId) result.push({ field_id: cityField.id, values: [{ enum_id: eId }] });
  }

  // UTM_ID — store utm_source as the primary UTM identifier
  if (utmIdField && utm.utm_source) {
    result.push({ field_id: utmIdField.id, values: [{ value: utm.utm_source }] });
  }
  // TRANID — store utm_campaign
  if (tranIdField && utm.utm_campaign) {
    result.push({ field_id: tranIdField.id, values: [{ value: utm.utm_campaign }] });
  }
  // Individual UTM fields (if configured in amoCRM)
  if (utmSourceField && utm.utm_source) {
    result.push({ field_id: utmSourceField.id, values: [{ value: utm.utm_source }] });
  }
  if (utmMediumField && utm.utm_medium) {
    result.push({ field_id: utmMediumField.id, values: [{ value: utm.utm_medium }] });
  }
  if (utmCampaignField && utm.utm_campaign) {
    result.push({ field_id: utmCampaignField.id, values: [{ value: utm.utm_campaign }] });
  }
  if (utmContentField && utm.utm_content) {
    result.push({ field_id: utmContentField.id, values: [{ value: utm.utm_content }] });
  }
  if (utmTermField && utm.utm_term) {
    result.push({ field_id: utmTermField.id, values: [{ value: utm.utm_term }] });
  }

  return result;
}

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

  const AMO_DOMAIN    = process.env.AMO_DOMAIN;
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

  const { name, phone, city, occasion, timing, config = {}, configUrl = '', utm = {} } = body;

  if (!name || !phone) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'name and phone are required' }) };
  }

  const amoBase = `https://${AMO_DOMAIN}.amocrm.ru/api/v4`;
  const amoHeaders = {
    'Authorization': `Bearer ${AMO_LONG_TOKEN}`,
    'Content-Type': 'application/json',
  };

  try {
    // 1. Fetch lead custom fields (cached per instance)
    const fields = await getLeadFields(amoBase, amoHeaders);

    // 2. Create contact
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

    // 3. Build config note (ring details + link)
    const configLines = [
      config.shapeLabel && `Огранка: ${config.shapeLabel}`,
      config.shankLabel && `Шинка: ${config.shankLabel}`,
      config.castLabel  && `Каст: ${config.castLabel}`,
      config.carat      && `Каратность: ${config.carat} кар`,
      config.gem1Label  && `Центр. бриллиант: ${config.gem1Label}`,
      config.gem2Label  && `Россыпь: ${config.gem2Label}`,
      config.metalLabel && `Металл: ${config.metalLabel}`,
    ].filter(Boolean).join('\n');

    const noteText = [
      '💍 Конфигурация украшения:',
      configLines || '—',
      configUrl ? `\n🔗 Ссылка: ${configUrl}` : '',
    ].filter(Boolean).join('\n').trim();

    // 4. Build lead name
    const leadName = [
      'Кольцо',
      config.shapeLabel,
      config.carat ? `${config.carat}кар` : null,
      '—',
      name,
    ].filter(Boolean).join(' ');

    // 5. Build custom fields for the lead
    const customFields = buildCustomFields(fields, { occasion, timing, city, utm });

    // 6. Create lead
    const leadPayload = [
      {
        name: leadName,
        custom_fields_values: customFields,
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

    // 7. Add note with ring config to lead
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
