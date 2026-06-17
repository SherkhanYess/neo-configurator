// TEMPORARY — delete after getting enum IDs
// Fetches enum values for the 3 select fields we need to map
export const handler = async () => {
  const AMO_DOMAIN     = process.env.AMO_DOMAIN;
  const AMO_LONG_TOKEN = process.env.AMO_LONG_TOKEN;
  const amoBase        = `https://${AMO_DOMAIN}.amocrm.ru/api/v4`;
  const amoHeaders     = { 'Authorization': `Bearer ${AMO_LONG_TOKEN}` };

  // IDs of the 3 select fields we need enum values for
  const SELECT_IDS = [409769, 420033, 420035]; // Город заказа, Повод покупки, Когда нужно

  const results = await Promise.all(
    SELECT_IDS.map(async (id) => {
      const res  = await fetch(`${amoBase}/leads/custom_fields/${id}`, { headers: amoHeaders });
      const data = await res.json();
      return {
        id:     data.id,
        name:   data.name,
        values: (data.values ?? []).map(v => ({ enum_id: v.enum_id, value: v.value })),
      };
    })
  );

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(results, null, 2),
  };
};
