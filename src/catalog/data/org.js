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

// Шоурумы. place — жилой комплекс, по которому человек ориентируется на месте;
// streetAddress — улица с номером дома, по которой работают карты и поисковики.
// В разметку schema.org идёт именно улица.
export const SHOWROOMS = [
  {
    city:          'Алматы',
    place:         'ЖК Esentai City',
    streetAddress: 'проспект Аль-Фараби, 116/36',
    phone:         '+7 (776) 670 8505',
    wa:            '77766708505',
    // Карточка компании в 2ГИС.
    twogis:        'https://2gis.kz/almaty/firm/70000001105797883',
  },
  {
    city:          'Астана',
    place:         'ЖК Atlant',
    streetAddress: 'улица Конаева, 5',
    phone:         '+7 (777) 690 8505',
    wa:            '77776908505',
    // Своей карточки в Астане пока нет — ссылка ведёт на сам жилой комплекс.
    twogis:        'https://2gis.kz/astana/geo/70030076386544768/71.420083,51.133619',
  },
];

// Часы работы шоурумов. OPENING_HOURS — формат schema.org, его читают карты и
// ассистенты; HOURS_NOTE — то же самое для человека. Живые показы идут по
// записи, поэтому в тексте сказано и про часы, и про запись.
export const OPENING_HOURS = 'Mo-Su 10:00-21:00';
export const HOURS_NOTE    = 'Ежедневно 10:00–21:00, показы по записи';

/** Адрес одной строкой: «Алматы, ЖК Esentai City, проспект Аль-Фараби, 116/36». */
export const showroomLine = (s) => `${s.city}, ${s.place}, ${s.streetAddress}`;

export const INSTAGRAM_HANDLE = '@neodiamond.kz';

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
    // sameAs связывает сайт с профилями, где о компании уже написано. Карточка
    // в 2ГИС весит здесь больше прочего: в Казахстане на неё опираются и карты,
    // и ассистенты, когда проверяют, что организация существует на самом деле.
    sameAs: [ORG.instagram, ...SHOWROOMS.map((s) => s.twogis)].filter(Boolean),
    areaServed: { '@type': 'Country', name: ORG.areaServed },
    location: SHOWROOMS.map((s) => ({
      '@type': 'JewelryStore',
      name: `${ORG.name} — ${s.city}`,
      telephone: s.phone,
      openingHours: OPENING_HOURS,
      hasMap: s.twogis,
      address: {
        '@type': 'PostalAddress',
        streetAddress: s.streetAddress,
        addressLocality: s.city,
        addressCountry: 'KZ',
      },
    })),
  };
}
