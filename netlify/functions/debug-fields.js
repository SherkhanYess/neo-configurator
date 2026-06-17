// TEMPORARY — returns full raw API response for select fields
export const handler = async () => {
  const AMO_DOMAIN     = process.env.AMO_DOMAIN;
  const AMO_LONG_TOKEN = process.env.AMO_LONG_TOKEN;
  const amoBase        = `https://${AMO_DOMAIN}.amocrm.ru/api/v4`;
  const amoHeaders     = { 'Authorization': `Bearer ${AMO_LONG_TOKEN}` };

  const SELECT_IDS = [409769, 420033, 420035];

  const results = await Promise.all(
    SELECT_IDS.map(async (id) => {
      const res  = await fetch(`${amoBase}/leads/custom_fields/${id}`, { headers: amoHeaders });
      const data = await res.json();
      return data; // full raw response — so we can see all keys
    })
  );

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(results, null, 2),
  };
};
