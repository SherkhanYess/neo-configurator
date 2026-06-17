// Neo Diamond Ring Configurator — static config + iJewel tag mapping

export const FILE_ID = 'MBYHa_BtQluSyH-pAufiAg';
export const INSTANCE = 'neodiamondkz';
export const WHATSAPP_NUMBER = '77766708505';

export const DIAMOND_SHAPES = [
  { id: 'round',    label: 'Круг',      ijewelTag: 'shape: round' },
  { id: 'oval',     label: 'Овал',      ijewelTag: 'shape: oval' },
  { id: 'pear',     label: 'Груша',     ijewelTag: 'shape: pear' },
  { id: 'marquise', label: 'Маркиз',    ijewelTag: 'shape: marquise' },
  { id: 'radiant',  label: 'Радиант',   ijewelTag: 'shape: radiant' },
  { id: 'emerald',  label: 'Изумруд',   ijewelTag: 'shape: emerald' },
  { id: 'cushion',  label: 'Кушон',     ijewelTag: 'shape: cushion' },
  { id: 'princess', label: 'Принцесса', ijewelTag: 'shape: princess' },
  { id: 'heart',    label: 'Сердце',    ijewelTag: 'shape: heart' },
  { id: 'asscher',  label: 'Ашер',      ijewelTag: 'shape: asher' },
];

export const CAST_DESIGNS = [
  { id: 'classic', label: 'Классика', sub: 'Крапаны', ijewelTag: 'cast: classic' },
  { id: 'halo',    label: 'Хало',     sub: 'Ореол',   ijewelTag: 'cast: halo' },
  { id: 'bezel',   label: 'Безель',   sub: 'Ободок',  ijewelTag: 'cast: bezel' },
];

export const SHANK_LABELS = {
  'Bezel':       'Безель',
  'Neo':         'Нео',
  'Neo Luxe':    'Нео Люкс',
  'Sirius':      'Сириус',
  'Sirius Luxe': 'Сириус Люкс',
};

export const CARAT_OPTIONS = [1, 1.5, 2, 3, 4, 5];

// Gem color grades (D=colorless ... K=faint yellow)
export const GEM_COLORS = [
  { id: 'D', label: 'D', color: '#F8F9FF', desc: 'Бесцветный' },
  { id: 'G', label: 'G', color: '#F5F6F2', desc: 'Почти бесцвет.' },
  { id: 'J', label: 'J', color: '#F5F3E8', desc: 'Слегка жёлтый' },
  { id: 'K', label: 'K', color: '#F2EDD8', desc: 'Еле заметный' },
];

export const METAL_COLORS = [
  { id: 'white',  label: 'Белое',   color: '#E8ECF1', ijewelTag: 'white' },
  { id: 'yellow', label: 'Жёлтое',  color: '#E8C66A', ijewelTag: 'yellow' },
  { id: 'rose',   label: 'Розовое', color: '#E7C3B0', ijewelTag: 'rose' },
];

export const METAL_PURITY = ['585', '750'];

// iJewel component hints — used for contains-search, not exact match.
// Open neodiamond.kz?debug=1 to see real names and update if needed.
export const IJEWEL_COMPONENT_NAMES = {
  heads: 'head',   // matches: Head, Heads, head, центральный камень, etc.
  shanks: 'shank', // matches: Shank, Shanks, shank, шинка, etc.
};

export const IJEWEL_MATERIAL_GROUPS = {
  shankMetal: 'шинки',      // "Цвет золота шинки"
  castMetal:  'каста',      // "Цвет золота каста"
  gem1:       'центрального', // "Цвет центрального..."
  gem2:       'боковых',    // "Цвет боковых бри..."
};

const SITE_URL = 'https://con.neodiamond.kz';

// Encode config as compact base64 — single ?c= param, no Cyrillic in URL
export const buildConfigUrl = (choices) => {
  const data = {};
  if (choices.shape)      data.sh = choices.shape;
  if (choices.shank)      data.sk = choices.shank;
  if (choices.cast)       data.ca = choices.cast;
  if (choices.carat)      data.ct = choices.carat;
  if (choices.gem1Label)  data.g1 = choices.gem1Label;
  if (choices.gem2Label)  data.g2 = choices.gem2Label;
  if (choices.metalLabel) data.mt = choices.metalLabel;
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
  return `${SITE_URL}/?c=${encoded}`;
};

// Decode ?c= param back to choices (for share-link landing)
export const parseConfigUrl = () => {
  try {
    const c = new URLSearchParams(window.location.search).get('c');
    if (!c) return null;
    const data = JSON.parse(decodeURIComponent(escape(atob(c))));
    return {
      shape:      data.sh ?? null,
      shank:      data.sk ?? null,
      cast:       data.ca ?? null,
      carat:      data.ct ? Number(data.ct) : null,
      gem1Label:  data.g1 ?? null,
      gem2Label:  data.g2 ?? null,
      metalLabel: data.mt ?? null,
      // derive labels from IDs where possible
      shapeLabel: data.sh ? (DIAMOND_SHAPES.find(s => s.id === data.sh)?.label ?? data.sh) : null,
      shankLabel: data.sk ?? null,
      castLabel:  data.ca ? (CAST_DESIGNS.find(c => c.id === data.ca)?.label ?? data.ca) : null,
    };
  } catch (_) { return null; }
};

export const buildWhatsappMessage = (choices) => {
  const url = buildConfigUrl(choices);
  return encodeURIComponent(
    `Здравствуйте! Я собрал украшение: ${url}\nХочу узнать стоимость и записаться на живую примерку!`
  );
};
