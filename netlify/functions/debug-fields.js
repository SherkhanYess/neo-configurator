// TEMPORARY — delete after getting field IDs
export const handler = async () => {
  const AMO_DOMAIN     = process.env.AMO_DOMAIN;
  const AMO_LONG_TOKEN = process.env.AMO_LONG_TOKEN;
  const amoBase        = `https://${AMO_DOMAIN}.amocrm.ru/api/v4`;
  const amoHeaders     = { 'Authorization': `Bearer ${AMO_LONG_TOKEN}` };

  const res  = await fetch(`${amoBase}/leads/custom_fields`, { headers: amoHeaders });
  const data = await res.json();

  const fields = (data._embedded?.custom_fields ?? []).map(f => ({
    id:     f.id,
    name:   f.name,
    type:   f.type,
    values: (f.values ?? []).map(v => ({ enum_id: v.enum_id, value: v.value })),
  }));

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(fields, null, 2),
  };
};
