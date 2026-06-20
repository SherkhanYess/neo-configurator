// Netlify Function: submit-lead
// Creates a contact + lead in amoCRM with all form fields mapped to CRM custom fields

// Hardcoded amoCRM field IDs and enum values (fetched via /api/debug-fields)
const AMO_FIELDS = {
  // «Город заказа» — field 409769
  city: {
    id: 409769,
    enums: {
      'Алматы':       268607,
      'Астана':       268609,
      'Шымкент':      268611,
      'Актобе':       268613,
      'Актау':        268615,
      'Караганды':    284341,
      'Атырау':       284343,
      'Другой город': 284345,
    },
  },
  // «Повод покупки» — field 420033
  occasion: {
    id: 420033,
    enums: {
      'Предложение': 284327,
      'Подарок':     284329,
      'Для себя':    284331,
    },
  },
  // «Когда нужно» — field 420035
  timing: {
    id: 420035,
    enums: {
      'До 5-дней':           284333,
      'В течений 10 дней':   284335,
      'В течений месяца':    284337,
      'Больше месяца':       284339,
    },
  },
  // UTM_ID — field 417935 (textarea)
  utmId: { id: 417935 },
  // TRANID — field 417929 (textarea)
  tranId: { id: 417929 },
  // UTM tracking_data fields
  utm_source:   { id: 61411 },
  utm_medium:   { id: 61407 },
  utm_campaign: { id: 61409 },
  utm_content:  { id: 61405 },
  utm_term:     { id: 61413 },
};

function buildCustomFields({ city, occasion, timing, utm = {} }) {
  const result = [];

  const addEnum = (fieldId, enumId) => {
    if (enumId) result.push({ field_id: fieldId, values: [{ enum_id: enumId }] });
  };
  const addText = (fieldId, value) => {
    if (value) result.push({ field_id: fieldId, values: [{ value: String(value) }] });
  };

  addEnum(AMO_FIELDS.city.id,     AMO_FIELDS.city.enums[city]);
  addEnum(AMO_FIELDS.occasion.id, AMO_FIELDS.occasion.enums[occasion]);
  addEnum(AMO_FIELDS.timing.id,   AMO_FIELDS.timing.enums[timing]);

  // UTM_ID = utm_source, TRANID = utm_campaign
  addText(AMO_FIELDS.utmId.id,  utm.utm_source);
  addText(AMO_FIELDS.tranId.id, utm.utm_campaign);

  // Individual UTM tracking fields
  addText(AMO_FIELDS.utm_source.id,   utm.utm_source);
  addText(AMO_FIELDS.utm_medium.id,   utm.utm_medium);
  addText(AMO_FIELDS.utm_campaign.id, utm.utm_campaign);
  addText(AMO_FIELDS.utm_content.id,  utm.utm_content);
  addText(AMO_FIELDS.utm_term.id,     utm.utm_term);

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

  const AMO_DOMAIN     = process.env.AMO_DOMAIN;
  const AMO_LONG_TOKEN = process.env.AMO_LONG_TOKEN;

  if (!AMO_DOMAIN || !AMO_LONG_TOKEN) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server misconfigured' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { name, city, occasion, timing, estimatedPrice, config = {}, configUrl = '', utm = {}, senderUtm = {}, configLinesWA = '' } = body;

  // For shared leads: use sender's UTM for attribution, but mark utm_term as 'share'
  const effectiveUtm = (senderUtm?.utm_source)
    ? { ...senderUtm, utm_term: 'share' }
    : utm;

  // Normalize phone to international format (+7XXXXXXXXXX)
  const rawPhone = String(body.phone || '').replace(/\D/g, ''); // strip non-digits
  const phone = rawPhone.startsWith('7') ? `+${rawPhone}` : rawPhone.startsWith('8') ? `+7${rawPhone.slice(1)}` : `+${rawPhone}`;

  if (!name || !phone) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'name and phone are required' }) };
  }

  const amoBase   = `https://${AMO_DOMAIN}.amocrm.ru/api/v4`;
  const amoHdrs   = {
    'Authorization': `Bearer ${AMO_LONG_TOKEN}`,
    'Content-Type':  'application/json',
  };

  try {
    // 1. Create contact
    const contactRes = await fetch(`${amoBase}/contacts`, {
      method: 'POST',
      headers: amoHdrs,
      body: JSON.stringify([{
        name,
        custom_fields_values: [{
          field_code: 'PHONE',
          values: [{ value: phone, enum_code: 'WORK' }],
        }],
      }]),
    });

    if (!contactRes.ok) {
      const err = await contactRes.text();
      console.error('amoCRM contact error:', err);
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'amoCRM contact failed', detail: err }) };
    }

    const contactData = await contactRes.json();
    const contactId   = contactData?._embedded?.contacts?.[0]?.id;

    // 2. Build ring config note
    const configLines = [
      config.shapeLabel && `Огранка: ${config.shapeLabel}`,
      config.shankLabel && `Шинка: ${config.shankLabel}`,
      config.castLabel  && `Каст: ${config.castLabel}`,
      config.carat      && `Каратность: ${config.carat} кар`,
      config.gem1Label  && `Центр. бриллиант: ${config.gem1Label}`,
      config.gem2Label  && `Россыпь: ${config.gem2Label}`,
      config.purity     && `Проба: ${config.purity}`,
      config.metalLabel && `Металл: ${config.metalLabel}`,
    ].filter(Boolean).join('\n');

    const noteText = [
      '💍 Конфигурация украшения:',
      configLines || '—',
      configUrl ? `\n🔗 Ссылка: ${configUrl}` : '',
    ].filter(Boolean).join('\n').trim();

    // 3. Lead name
    const leadName = ['Кольцо', config.shapeLabel, config.carat ? `${config.carat}кар` : null, '—', name]
      .filter(Boolean).join(' ');

    // 4. Create lead with mapped custom fields
    const customFields = buildCustomFields({ city, occasion, timing, utm: effectiveUtm });

    const leadRes = await fetch(`${amoBase}/leads`, {
      method: 'POST',
      headers: amoHdrs,
      body: JSON.stringify([{
        name: leadName,
        custom_fields_values: customFields,
        ...(contactId ? { _embedded: { contacts: [{ id: contactId }] } } : {}),
      }]),
    });

    if (!leadRes.ok) {
      const err = await leadRes.text();
      console.error('amoCRM lead error:', err);
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'amoCRM lead failed', detail: err }) };
    }

    const leadData = await leadRes.json();
    const leadId   = leadData?._embedded?.leads?.[0]?.id;

    // 5. Add ring config as note
    if (leadId && noteText) {
      await fetch(`${amoBase}/leads/${leadId}/notes`, {
        method: 'POST',
        headers: amoHdrs,
        body: JSON.stringify([{ note_type: 'common', params: { text: noteText } }]),
      }).catch((e) => console.warn('note failed:', e));
    }

    // Send WhatsApp messages to client via Wazzup
    const WAZZUP_KEY        = process.env.WAZZUP_API_KEY;
    const WAZZUP_CHANNEL_ID = process.env.WAZZUP_CHANNEL_ID;

    if (WAZZUP_KEY && WAZZUP_CHANNEL_ID) {
      const sendWazzup = async (text) => {
        try {
          const res = await fetch('https://api.wazzup24.com/v3/message', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${WAZZUP_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              channelId: WAZZUP_CHANNEL_ID,
              chatType:  'whatsapp',
              chatId:    phone,
              text,
            }),
          });
          const body = await res.text();
          console.log('Wazzup:', res.status, body);
          return { status: res.status, body };
        } catch (e) {
          console.warn('Wazzup error:', e);
          return { status: null, body: String(e) };
        }
      };

      // Use pre-formatted lines from frontend (includes prices per line)
      const configLines = configLinesWA || [
        config.shapeLabel && `▪️ ${config.shankLabel} - ${config.shapeLabel}`,
        config.castLabel  && `▪️ Дизайн каста - ${config.castLabel}`,
        config.carat      && `▪️ Каратность - ${Number(config.carat).toFixed(2)}`,
        config.purity     && `▪️ Проба золота - ${config.purity}`,
        config.metalLabel && `▪️ Цвет золота: ${config.metalLabel}`,
      ].filter(Boolean).join('\n');

      const priceStr = estimatedPrice
        ? `${Number(estimatedPrice).toLocaleString('ru-KZ')} ₸`
        : 'уточняется';

      // Message 1 — configuration summary
      const msg1 = [
        `Здравствуйте, ${name}! 👋`,
        '',
        'Мы — *Neo Diamond*. Ювелирная студия формата конструктор. 💎',
        '',
        'Поздравляем — вы собрали украшение на нашем онлайн-конструкторе со следующими характеристиками:',
        '',
        configLines,
        '',
        `💰 *Стоимость данного украшения: ${priceStr}*`,
        '',
        'Знайте, что всегда можно сделать украшение дешевле или дороже — в зависимости от вашего запроса.',
        '',
        '⏱ Стандартный срок изготовления в нашей студии — *7–14 дней*, но имеется срочное изготовление по запросу!',
      ].join('\n');

      // Message 2 — budget check
      const msg2 = 'Как вам цена, подходит по бюджету? 😊';

      // Send first message
      const w1 = await sendWazzup(msg1);

      // Wait 10 seconds, then send follow-up
      await new Promise((resolve) => setTimeout(resolve, 10000));
      const w2 = await sendWazzup(msg2);

      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, leadId, contactId, wazzup1: w1.status, wazzup2: w2.status }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, leadId, contactId }) };
  } catch (err) {
    console.error('submit-lead error:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal error', detail: String(err) }) };
  }
};
