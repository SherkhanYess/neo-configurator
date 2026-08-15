export const SHAPES = [
  { id: 'round',    label: 'Круглый',   file: 'round.jpg' },
  { id: 'princess', label: 'Принцесса', file: 'princess.jpg' },
  { id: 'radiant',  label: 'Радиант',   file: 'radiant.jpg' },
  { id: 'cushion',  label: 'Кушон',     file: 'cushion.jpg' },
  { id: 'oval',     label: 'Овал',      file: 'oval.jpg' },
  { id: 'pear',     label: 'Груша',     file: 'pear.jpg' },
  { id: 'heart',    label: 'Сердце',    file: 'heart.jpg' },
  { id: 'marquise', label: 'Маркиз',    file: 'marquise.jpg' },
  { id: 'emerald',  label: 'Изумруд',   file: 'emerald.jpg' },
  { id: 'asscher',  label: 'Ашер',      file: 'asscher.jpg' },
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
  return `/assets/rings/${slug}-${shape}.png`;
}

export const METALS = ['585', '750'];
export const METAL_LABELS = { '585': '14к Золото', '750': '18к Золото' };
export const METAL_COLORS = [
  { id: 'white',  label: 'Белое' },
  { id: 'yellow', label: 'Жёлтое' },
  { id: 'rose',   label: 'Розовое' },
];

export const IJEWEL_INSTANCE = 'neodiamondkz';
export const IJEWEL_FILE_ID  = 'MBYHa_BtQluSyH-pAufiAg';

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
