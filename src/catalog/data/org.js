// Единственный источник правды о компании.
//
// Эти данные попадают в три места сразу: в видимый футер, в разметку
// schema.org для поисковиков и ассистентов, и в статические страницы, которые
// собирает scripts/prerender.mjs. Поэтому файл намеренно без JSX и без
// зависимостей — его импортирует и React, и node-скрипт сборки.
//
// Правка адреса или телефона здесь меняет их везде. Больше нигде их дублировать
// не нужно.

export const ORG = {
  name:        'Neo Diamond',
  legalName:   'Neo Diamond',
  tagline:     'Студия украшений с лабораторными бриллиантами',
  description:
    'Помолвочные кольца и украшения с лабораторными бриллиантами. Собственное ' +
    'производство: выбираете огранку, каратность, металл и оправу — изготавливаем ' +
    'за 5–10 календарных дней. Каждый камень от 0,5 карата с сертификатом IGI.',
  // sameAs в разметке говорит поисковику, что сайт и этот профиль — одна и та
  // же организация. Без такой связки упоминания в Instagram не засчитываются
  // сайту.
  instagram:   'https://www.instagram.com/neodiamond.kz/',
  areaServed:  'Казахстан',
  priceFrom:   550000,
  currency:    'KZT',
};

// Шоурумы. streetAddress пока хранит жилой комплекс — как только появится
// точный адрес с улицей и номером дома, дописывается сюда, и футер с разметкой
// обновляются сами.
export const SHOWROOMS = [
  {
    city:          'Алматы',
    streetAddress: 'ЖК Esentai City',
    phone:         '+7 776 670 85 05',
    wa:            '77766708505',
  },
  {
    city:          'Астана',
    streetAddress: 'ЖК Atlant',
    phone:         '+7 777 690 85 05',
    wa:            '77776908505',
  },
];

// Часы работы шоурумов. OPENING_HOURS — формат schema.org, его читают карты и
// ассистенты; HOURS_NOTE — то же самое для человека. Живые показы идут по
// записи, поэтому в тексте сказано и про часы, и про запись.
export const OPENING_HOURS = 'Mo-Su 10:00-21:00';
export const HOURS_NOTE    = 'Ежедневно 10:00–21:00, показы по записи';

// Короткие факты о сервисе. Ровно те же формулировки, что в карточке товара и в
// ответах на вопросы, — расхождения в цифрах между страницами читаются как
// недостоверность.
export const FACTS = [
  ['Изготовление',  '5–10 календарных дней'],
  ['Сертификат',    'IGI на каждый камень от 0,5 карата'],
  ['Доставка',      'По Казахстану бесплатно, 2–5 дней'],
  ['Оплата',        'По договору: 50% при заключении, 50% при получении'],
  ['Обслуживание',  'Чистка и родирование — бесплатно, пожизненно'],
];

/** Адрес одной строкой: «Алматы, ЖК Esentai City». */
export const showroomLine = (s) => `${s.city}, ${s.streetAddress}`;

/**
 * Разметка организации для поисковиков и ИИ-ассистентов.
 *
 * Вложенные JewelryStore на каждый шоурум, а не один общий адрес: для карты и
 * для ассистента это два разных физических места, и объединять их в одно —
 * значит потерять один из городов в ответе на вопрос «где вы находитесь».
 */
export function organizationJsonLd(site) {
  return {
    '@context': 'https://schema.org',
    '@type': 'JewelryStore',
    '@id': `${site}/#organization`,
    name: ORG.name,
    url: site,
    description: ORG.description,
    priceRange: `от ${ORG.priceFrom} ${ORG.currency}`,
    currenciesAccepted: ORG.currency,
    ...(ORG.instagram ? { sameAs: [ORG.instagram] } : {}),
    areaServed: { '@type': 'Country', name: ORG.areaServed },
    location: SHOWROOMS.map((s) => ({
      '@type': 'JewelryStore',
      name: `${ORG.name} — ${s.city}`,
      telephone: s.phone,
      openingHours: OPENING_HOURS,
      address: {
        '@type': 'PostalAddress',
        streetAddress: s.streetAddress,
        addressLocality: s.city,
        addressCountry: 'KZ',
      },
    })),
  };
}
