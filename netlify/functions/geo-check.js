// Временная диагностика: показывает, что функция видит о клиенте.
//
// Нужна ровно для одного вопроса — доезжает ли география посетителя до
// функции, когда запрос приходит через прокси с neodiamond.kz, а не напрямую
// на con.neodiamond.kz. От этого зависит разбивка по городам в дашборде.
//
// Ничего не пишет и не отдаёт ничего секретного. Удалить сразу после проверки.

export default async (req, context) => {
  const h = req.headers;
  return new Response(JSON.stringify({
    geo: context?.geo ?? null,
    forwardedFor: h.get('x-forwarded-for'),
    nfClientIp:   h.get('x-nf-client-connection-ip'),
    via:          h.get('via'),
    host:         h.get('host'),
  }, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
};
