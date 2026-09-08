export const SHAPES = [
  { id: 'round',    label: 'Круглый',   file: 'round.webp' },
  { id: 'princess', label: 'Принцесса', file: 'princess.webp' },
  { id: 'radiant',  label: 'Радиант',   file: 'radiant.webp' },
  { id: 'cushion',  label: 'Кушон',     file: 'cushion.webp' },
  { id: 'oval',     label: 'Овал',      file: 'oval.webp' },
  { id: 'pear',     label: 'Груша',     file: 'pear.webp' },
  { id: 'heart',    label: 'Сердце',    file: 'heart.webp' },
  { id: 'marquise', label: 'Маркиз',    file: 'marquise.webp' },
  { id: 'emerald',  label: 'Изумруд',   file: 'emerald.webp' },
  { id: 'asscher',  label: 'Ашер',      file: 'asscher.webp' },
];

// Real shank designs from iJewel. id = exact iJewel variation name.
// Bezel shank only pairs with bezel cast (enforced in CATALOG_PRODUCTS).
export const SHANKS = [
  { id: 'Neo',         label: 'Neo' },
  { id: 'Neo Luxe',    label: 'Neo Luxe' },
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
  { shank: 'Neo Luxe',    cast: 'classic' },
  { shank: 'Neo Luxe',    cast: 'halo' },
  { shank: 'Sirius',      cast: 'classic' },
  { shank: 'Sirius',      cast: 'halo' },
  { shank: 'Sirius Luxe', cast: 'classic' },
  { shank: 'Sirius Luxe', cast: 'halo' },
  { shank: 'Bezel',       cast: 'bezel' },
];

// Model name by shank+cast combo (Sirius+halo = "Halo", Neo Luxe+halo = "Neo Halo Luxe", etc.)
const MODEL_NAMES = {
  'Neo|classic':         'Neo',
  'Neo|halo':            'Neo Halo',
  'Neo Luxe|classic':    'Neo Luxe',
  'Neo Luxe|halo':       'Neo Halo Luxe',
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

const MODEL_SLUG = {
  'Neo':           'neo',
  'Neo Halo':      'neo-halo',
  'Neo Luxe':      'neo-luxe',
  'Neo Halo Luxe': 'neo-halo-luxe',
  'Sirius':        'sirius',
  'Sirius Luxe':   'sirius-luxe',
  'Halo':          'halo',
  'Halo Luxe':     'halo-luxe',
  'Bezel':         'bezel',
};

export function ringImage(shankId, castId, shapeId) {
  const slug = MODEL_SLUG[modelName(shankId, castId)];
  if (!slug) return null;
  const shape = shapeId ?? 'round';
  return `/assets/rings/${slug}-${shape}.webp`;
}

export const METALS = ['585', '750'];
export const METAL_LABELS = { '585': '14к Золото', '750': '18к Золото' };
export const METAL_COLORS = [
  { id: 'white',  label: 'Белое' },
  { id: 'yellow', label: 'Жёлтое' },
  { id: 'rose',   label: 'Розовое' },
];

export const IJEWEL_INSTANCE   = 'neodiamondkz';
export const IJEWEL_FILE_ID    = 'MBYHa_BtQluSyH-pAufiAg';
export const PUSETЫ_IJEWEL_FILE_ID = 'W_rSwFUyS_CtAyfx1BTS1A';

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

// All valid cast × shape combos for pusety catalog grid
export const PUSETЫ_VALID_COMBOS = [
  ...PUSETЫ_SHAPES_BY_CAST.classic.map(shape => ({ cast: 'classic', shape })),
  ...PUSETЫ_SHAPES_BY_CAST.halo   .map(shape => ({ cast: 'halo',    shape })),
];

export function pusetyCardName(castId, shapeLabel) {
  const castLabel = castId === 'halo' ? 'Halo' : 'Classic';
  return `Пусеты ${castLabel} ${shapeLabel}`;
}

export const WA_NUMBER = '77766708505';

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
