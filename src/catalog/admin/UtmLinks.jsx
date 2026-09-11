import { useState } from 'react';

// Ready-made tagged links for the places traffic actually comes from.
//
// The catalog already reads utm_* on load and attaches the source to every
// event, so a link built here shows up in «Источники» above without any further
// setup. The point of the block is that the tags are written once, correctly:
// a typo in utm_source silently creates a second source that never reconciles.
//
// Standard tagging: utm_source is the platform, utm_medium is the placement.
// «Источники» keys on source AND medium together, so instagram/bio and
// instagram/stories stay separate rows instead of collapsing into «instagram».

const C = {
  paper050: '#FAFBFC', paper100: '#F2F5F9', paper300: '#DBE2EB',
  ink800: '#0B2040', ink600: '#1E3149', ink400: '#5B81A1', champ700: '#7C6035',
};

const BASE = 'https://con.neodiamond.kz/catalog';

export const UTM_PRESETS = [
  {
    id: 'instagram_bio',
    title: 'Instagram — шапка профиля',
    note: 'Ссылка в био. Основной источник трафика.',
    params: { utm_source: 'instagram', utm_medium: 'bio' },
  },
  {
    id: 'instagram_stories',
    title: 'Instagram — сторис',
    note: 'Свайп-ап или стикер-ссылка в сторис.',
    params: { utm_source: 'instagram', utm_medium: 'stories' },
  },
  {
    id: 'instagram_post',
    title: 'Instagram — пост или Reels',
    note: 'Ссылка из описания публикации.',
    params: { utm_source: 'instagram', utm_medium: 'post' },
  },
  {
    id: 'whatsapp',
    title: 'WhatsApp — рассылка',
    note: 'Когда менеджер отправляет каталог в чате.',
    params: { utm_source: 'whatsapp', utm_medium: 'manager' },
  },
];

export function buildUtmUrl(params) {
  const q = new URLSearchParams(params);
  return `${BASE}?${q.toString()}`;
}

// Friendly names for the «Источники» breakdown, keyed the same way the server
// keys them: «source / medium».
export const UTM_LABELS = Object.fromEntries(
  UTM_PRESETS.map(p => [`${p.params.utm_source} / ${p.params.utm_medium}`, p.title])
);

function LinkRow({ preset }) {
  const [copied, setCopied] = useState(false);
  const url = buildUtmUrl(preset.params);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {
      setCopied(false);
    }
  }

  return (
    <div style={{
      background: '#fff', border: `1.5px solid ${C.paper300}`,
      borderRadius: 16, padding: '14px 16px',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div>
        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: C.ink800, lineHeight: 1.3 }}>
          {preset.title}
        </div>
        <div style={{ fontSize: '0.75rem', color: C.ink400, marginTop: 2, lineHeight: 1.45 }}>
          {preset.note}
        </div>
      </div>

      <div style={{
        background: C.paper100, borderRadius: 10, padding: '9px 12px',
        fontFamily: '"JetBrains Mono","Courier New",monospace',
        fontSize: '0.68rem', color: C.ink600, lineHeight: 1.5,
        wordBreak: 'break-all',
      }}>
        {url}
      </div>

      <button
        type="button"
        onClick={copy}
        style={{
          alignSelf: 'flex-start',
          padding: '8px 18px', borderRadius: 50, cursor: 'pointer',
          border: `1.5px solid ${copied ? '#2e7d32' : C.paper300}`,
          background: copied ? '#2e7d32' : '#fff',
          color: copied ? '#fff' : C.ink800,
          fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 600,
          transition: 'background 0.18s, border-color 0.18s, color 0.18s',
        }}
      >
        {copied ? 'Скопировано' : 'Копировать ссылку'}
      </button>
    </div>
  );
}

export default function UtmLinks({ eyebrowStyle }) {
  return (
    <div style={{
      background: '#fff', border: `1.5px solid ${C.paper300}`,
      borderRadius: 20, padding: '20px 22px',
    }}>
      <div style={eyebrowStyle}>Ссылки с метками</div>

      <p style={{ margin: '0 0 16px', fontSize: '0.82rem', color: C.ink400, lineHeight: 1.6 }}>
        Размещайте только эти ссылки — тогда каждый источник будет виден
        в разделе «Источники» выше. Обычная ссылка без меток попадёт
        в «Прямой заход».
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {UTM_PRESETS.map(p => <LinkRow key={p.id} preset={p} />)}
      </div>
    </div>
  );
}
