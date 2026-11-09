// Фото огранок кешируются браузером навсегда (immutable). Заменили картинки —
// поднимите версию, иначе у вернувшихся посетителей останутся старые.
export const SHAPES_VERSION = 2;
export const shapeImage = (file) => `/assets/shapes/${file}?v=${SHAPES_VERSION}`;

export const SHAPES = [
  { id: 'round',    label: 'Круглый',   file: 'round.webp' },
  { id: 'oval',     label: 'Овал',      file: 'oval.webp' },
  { id: 'pear',     label: 'Груша',     file: 'pear.webp' },
  { id: 'marquise', label: 'Маркиз',    file: 'marquise.webp' },
  { id: 'heart',    label: 'Сердце',    file: 'heart.webp' },
  { id: 'cushion',  label: 'Кушон',     file: 'cushion.webp' },
  { id: 'princess', label: 'Принцесса', file: 'princess.webp' },
  { id: 'radiant',  label: 'Радиант',   file: 'radiant.webp' },
  { id: 'emerald',  label: 'Изумруд',   file: 'emerald.webp' },
  { id: 'asscher',  label: 'Ашер',      file: 'asscher.webp' },
];

// Модели, с которыми витрина работает, пока в админке ничего не сохранено.
// Дальше список моделей живёт в админке («Модели и цены»): там их добавляют и
// удаляют, а это — только стартовый набор (src/catalog/data/models.js).
// id = точное имя вариации шинки в iJewel.
export const SHANKS = [
  { id: 'Neo',         label: 'Neo' },
  { id: 'Sirius',      label: 'Sirius' },
  { id: 'Sirius Luxe', label: 'Sirius Luxe' },
  { id: 'Bezel',       label: 'Bezel' },
];

export const CASTS = [
  { id: 'classic', label: 'Classic' },
  { id: 'halo',    label: 'Halo' },
  { id: 'bezel',   label: 'Bezel' },
];

// Valid shank × cast combinations.
// Rule: Bezel shank → only bezel cast. All other shanks → classic + halo.
export const VALID_COMBOS = [
  { shank: 'Neo',         cast: 'classic' },
  { shank: 'Neo',         cast: 'halo' },
  { shank: 'Sirius',      cast: 'classic' },
  { shank: 'Sirius',      cast: 'halo' },
  { shank: 'Sirius Luxe', cast: 'classic' },
  { shank: 'Sirius Luxe', cast: 'halo' },
  { shank: 'Bezel',       cast: 'bezel' },
];

// Имя модели по паре «шинка + оправа» (Sirius + halo = «Halo» и т. п.).
const MODEL_NAMES = {
  'Neo|classic':         'Neo',
  'Neo|halo':            'Neo Halo',
  'Sirius|classic':      'Sirius',
  'Sirius|halo':         'Halo',
  'Sirius Luxe|classic': 'Sirius Luxe',
  'Sirius Luxe|halo':    'Halo Luxe',
  'Bezel|bezel':         'Bezel',
};

export function modelName(shankId, castId) {
  return MODEL_NAMES[`${shankId}|${castId}`] ?? shankId;
}

export function cardName(shankId, castId, shapeLabel) {
  return [modelName(shankId, castId), shapeLabel].filter(Boolean).join(' ');
}

// Студийные рендеры public/assets/rings/<файл>-<огранка>.webp — по паре
// «шинка + оправа», а не по имени: имя меняют в админке, файлы остаются.
// У моделей, добавленных в админке, рендеров нет — там фото из «Ленты».
const RENDERS = {
  'Neo|classic':         'neo',
  'Neo|halo':            'neo-halo',
  'Sirius|classic':      'sirius',
  'Sirius|halo':         'halo',
  'Sirius Luxe|classic': 'sirius-luxe',
  'Sirius Luxe|halo':    'halo-luxe',
  'Bezel|bezel':         'bezel',
};

export const renderSlug = (shankId, castId) => RENDERS[`${shankId}|${castId}`] ?? null;

export function ringImage(shankId, castId, shapeId) {
  const slug = renderSlug(shankId, castId);
  if (!slug) return null;
  return `/assets/rings/${slug}-${shapeId ?? 'round'}.webp`;
}

export const METAL_COLORS = [
  { id: 'white',  label: 'Белое' },
  { id: 'yellow', label: 'Жёлтое' },
  { id: 'rose',   label: 'Розовое' },
];

// ── Пусеты ────────────────────────────────────────────────────────────────────
// Casts available for pusety
export const PUSETЫ_CASTS = [
  { id: 'classic', label: 'Classic' },
  { id: 'halo',    label: 'Halo' },
];

// Shapes available per cast for pusety.
// Halo missing: heart, asscher, princess, cushion (to be added later)
export const PUSETЫ_SHAPES_BY_CAST = {
  classic: ['round','princess','radiant','cushion','oval','pear','heart','marquise','emerald','asscher'],
  halo:    ['round','oval','pear','marquise','emerald','radiant'],
};

export const WA_NUMBER = '77766708505';

// Каждый шоурум отвечает со своего номера. «Другой город» ведёт в Алматы —
// там головной офис. Те же номера, что и в конструкторе на главной.
export const WA_BY_CITY = {
  'Алматы':       '77766708505',
  'Астана':       '77776908505',
  'Другой город': '77766708505',
};

export const SHAPE_IJEWEL = {
  round:    'shape: round',
  princess: 'shape: princess',
  radiant:  'shape: radiant',
  cushion:  'shape: cushion',
  oval:     'shape: oval',
  pear:     'shape: pear',
  heart:    'shape: heart',
  marquise: 'shape: marquise',
  emerald:  'shape: emerald',
  asscher:  'shape: asscher',
};

export const CAST_IJEWEL = {
  classic: 'cast: classic',
  halo:    'cast: halo',
  bezel:   'cast: bezel',
};
