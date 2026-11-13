// Намёк → сообщение ему в WhatsApp, сразу после отправки формы. Шлём шаблон
// Meta через Kelesu — так же, как конструктор шлёт свой. Ответ он пишет в тот
// же WhatsApp, менеджер видит его в чате сделки amoCRM.
//
// Шаблоны (Meta, категория «Маркетинг»):
//   taena_hint         — она указала размер;
//   taena_hint_nosize  — размер не знает.
// Тело: {{1}} — его имя, {{2}} — кольцо. Кнопка-ссылка «Посмотреть её
// кольцо»: https://taena.neodiamond.kz/{{1}}, {{1}} — путь кольца.
//
// Нет ключей Kelesu (KELESU_API_KEY, KELESU_CHANNEL_ID) — не шлём.

const SITE = 'https://taena.neodiamond.kz/';

/** Путь кольца для кнопки: ссылка для него без адреса сайта. */
export function linkSuffix(link) {
  const s = String(link ?? '');
  return s.startsWith(SITE) ? s.slice(SITE.length) : '';
}

/** Meta не пускает в параметры переводы строк, табы и 4+ пробела подряд. */
const clean = (s) => String(s ?? '').replace(/[\n\r\t]+/g, ' ').replace(/ {4,}/g, ' ').trim();

/** Тело запроса Kelesu: шаблон, его имя и кольцо, путь для кнопки. */
export function kelesuPayload(h) {
  return {
    phone_number: String(h.phone).replace(/\D/g, ''),
    template_name: h.size ? 'taena_hint' : 'taena_hint_nosize',
    components: [
      { type: 'body', parameters: [{ type: 'text', text: clean(h.name) }, { type: 'text', text: clean(h.ring) }] },
      { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: linkSuffix(h.link) }] },
    ],
  };
}

/** Отправка. null — ключей нет; иначе ответ Kelesu; ошибка — исключение. */
export async function sendHintWa(h) {
  const key = process.env.KELESU_API_KEY;
  const channel = process.env.KELESU_CHANNEL_ID;
  if (!key || !channel) return null;
  const res = await fetch(`https://api.kelesu.kz/api/v1/waba/channels/${channel}/templates/send-to-phone`, {
    method: 'POST',
    headers: { 'X-API-Key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify(kelesuPayload(h)),
    signal: AbortSignal.timeout(8000),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`kelesu ${res.status}: ${text.slice(0, 200)}`);
  return text.slice(0, 300);
}
