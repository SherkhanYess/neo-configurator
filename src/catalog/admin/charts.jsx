import { useState, useRef } from 'react';

// Chart primitives for the admin dashboard.
//
// Hand-rolled SVG rather than a charting library: three shapes are needed, and a
// dependency would outweigh them.
//
// The two series colours were picked by running the palette validator, not by
// eye — the brand's own ink and champagne fail it (ink too dark, both too low in
// chroma to read as distinct hues). These are the nearest steps in the same two
// hue families that clear the lightness band, the chroma floor, CVD separation
// and contrast, in both light and dark modes.
export const SERIES = {
  1: '#2F6BB8',   // холодный синий — того же семейства, что ink
  2: '#C08422',   // тёплое золото — того же семейства, что champagne
};

const T = {
  primary:   '#0B2040',
  secondary: '#1E3149',
  muted:     '#5B81A1',
  grid:      '#E9EDF3',
  surface:   '#FFFFFF',
};

const mono = { fontFamily: '"JetBrains Mono","Courier New",monospace', fontVariantNumeric: 'tabular-nums' };

function fmt(n) {
  return Number(n).toLocaleString('ru-KZ');
}

// ─── Stat tile ───────────────────────────────────────────────────────────────
// The number IS the chart. A one-bar bar chart would say less.
export function StatTile({ label, value, hint, accent }) {
  return (
    <div style={{
      background: T.surface, border: '1.5px solid #DBE2EB', borderRadius: 18,
      padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{
        fontSize: '0.66rem', fontWeight: 700, letterSpacing: '0.13em',
        textTransform: 'uppercase', color: T.muted,
      }}>
        {label}
      </div>
      {/* Proportional figures: tabular-nums makes a large number look loose. */}
      <div style={{
        fontFamily: 'Manrope, sans-serif', fontSize: '2rem', fontWeight: 700,
        lineHeight: 1.05, color: accent ?? T.primary, letterSpacing: '-0.02em',
      }}>
        {value}
      </div>
      {hint && <div style={{ fontSize: '0.76rem', color: T.muted, lineHeight: 1.45 }}>{hint}</div>}
    </div>
  );
}

// ─── Horizontal bars ─────────────────────────────────────────────────────────
// One series, therefore one colour for every bar: a darker-where-bigger ramp
// would encode length twice and say nothing new.
export function BarList({ rows, labels, unit, empty, max: maxProp }) {
  const [hover, setHover] = useState(null);
  const data = rows.slice(0, 12);
  const max = maxProp ?? (data.length ? Math.max(...data.map(r => r[1])) : 0);

  if (!data.length) {
    return <p style={{ margin: 0, fontSize: '0.85rem', color: T.muted }}>{empty ?? 'Пока нет данных'}</p>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {data.map(([key, n]) => (
        <div
          key={key}
          onMouseEnter={() => setHover(key)}
          onMouseLeave={() => setHover(null)}
          style={{ cursor: 'default' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, marginBottom: 5 }}>
            <span style={{ fontSize: '0.84rem', color: T.secondary, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {labels?.[key] ?? key}
            </span>
            {/* Value is directly labelled, so nothing is gated behind hover. */}
            <span style={{ ...mono, fontSize: '0.84rem', color: T.primary, fontWeight: 700, whiteSpace: 'nowrap' }}>
              {fmt(n)}{unit ? ` ${unit}` : ''}
            </span>
          </div>
          <div style={{ height: 10, background: T.grid, borderRadius: 2 }}>
            <div style={{
              width: `${max ? Math.max((n / max) * 100, 1.5) : 0}%`,
              height: '100%',
              background: SERIES[1],
              opacity: hover && hover !== key ? 0.45 : 1,
              // Square at the baseline, rounded at the data end.
              borderRadius: '2px 4px 4px 2px',
              transition: 'opacity 0.15s, width 0.35s ease',
            }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Funnel ──────────────────────────────────────────────────────────────────
export function FunnelChart({ conversion, labels }) {
  const top = conversion[0]?.sessions ?? 0;
  if (!top) {
    return (
      <p style={{ margin: 0, fontSize: '0.87rem', color: T.muted, lineHeight: 1.6 }}>
        За выбранный период данных ещё нет.
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {conversion.map((row, i) => {
        const drop = i > 0 ? +(100 - row.ofPrevious).toFixed(1) : 0;
        return (
          <div key={row.step}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 14, marginBottom: 6 }}>
              <span style={{ fontSize: '0.87rem', color: T.primary, fontWeight: 500 }}>
                {labels[row.step] ?? row.step}
              </span>
              <span style={{ ...mono, fontSize: '0.87rem', color: T.primary, fontWeight: 700, whiteSpace: 'nowrap' }}>
                {fmt(row.sessions)}
                <span style={{ color: T.muted, fontWeight: 400 }}> · {row.ofTotal}%</span>
              </span>
            </div>
            <div style={{ height: 14, background: T.grid, borderRadius: 2 }}>
              <div style={{
                width: `${Math.max(row.ofTotal, row.sessions > 0 ? 1.5 : 0)}%`,
                height: '100%', background: SERIES[1],
                borderRadius: '2px 4px 4px 2px',
                transition: 'width 0.35s ease',
              }} />
            </div>
            {i > 0 && drop > 0 && (
              <div style={{ ...mono, fontSize: '0.72rem', color: T.muted, marginTop: 5 }}>
                −{drop}% от предыдущего шага
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Trend (two series over time) ────────────────────────────────────────────
export function TrendChart({ daily, series, height = 240 }) {
  const [hoverIdx, setHoverIdx] = useState(null);
  const wrapRef = useRef(null);

  if (!daily.length) {
    return <p style={{ margin: 0, fontSize: '0.85rem', color: T.muted }}>Пока нет данных за период.</p>;
  }

  const PAD = { top: 16, right: 18, bottom: 30, left: 44 };
  const W = 900;
  const H = height;
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  const values = daily.flatMap(d => series.map(s => d[s.key] ?? 0));
  const rawMax = Math.max(...values, 1);
  // Clean ticks rather than an arbitrary max.
  const step = Math.max(1, Math.ceil(rawMax / 4 / 5) * 5);
  const max = step * 4;

  const x = (i) => PAD.left + (daily.length === 1 ? plotW / 2 : (i / (daily.length - 1)) * plotW);
  const y = (v) => PAD.top + plotH - (v / max) * plotH;

  const path = (key) => daily.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d[key] ?? 0).toFixed(1)}`).join(' ');
  const area = (key) =>
    `${path(key)} L${x(daily.length - 1).toFixed(1)},${(PAD.top + plotH).toFixed(1)} L${x(0).toFixed(1)},${(PAD.top + plotH).toFixed(1)} Z`;

  const ticks = [0, 1, 2, 3, 4].map(i => i * step);
  const labelEvery = Math.ceil(daily.length / 7);

  function onMove(e) {
    const r = wrapRef.current.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const i = Math.round(((px - PAD.left) / plotW) * (daily.length - 1));
    setHoverIdx(Math.max(0, Math.min(daily.length - 1, i)));
  }

  return (
    <div>
      {/* Two series, so a legend is always present — identity never rests on colour alone. */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 10 }}>
        {series.map(s => (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 14, height: 3, borderRadius: 2, background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: '0.78rem', color: T.secondary }}>{s.title}</span>
          </div>
        ))}
      </div>

      <div
        ref={wrapRef}
        onMouseMove={onMove}
        onMouseLeave={() => setHoverIdx(null)}
        style={{ position: 'relative' }}
      >
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 'auto', display: 'block' }} role="img">
          {ticks.map(t => (
            <g key={t}>
              {/* Hairline, solid, one step off the surface. */}
              <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke={T.grid} strokeWidth="1" />
              <text x={PAD.left - 10} y={y(t) + 4} textAnchor="end"
                style={{ ...mono, fontSize: 11, fill: T.muted }}>
                {fmt(t)}
              </text>
            </g>
          ))}

          {daily.map((d, i) => (i % labelEvery === 0 || i === daily.length - 1) && (
            <text key={d.day} x={x(i)} y={H - 10} textAnchor="middle"
              style={{ ...mono, fontSize: 11, fill: T.muted }}>
              {d.day.slice(8)}.{d.day.slice(5, 7)}
            </text>
          ))}

          {series.map(s => (
            <path key={`a-${s.key}`} d={area(s.key)} fill={s.color} opacity="0.1" />
          ))}
          {series.map(s => (
            <path key={`l-${s.key}`} d={path(s.key)} fill="none" stroke={s.color}
              strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          ))}

          {hoverIdx !== null && (
            <line x1={x(hoverIdx)} x2={x(hoverIdx)} y1={PAD.top} y2={PAD.top + plotH}
              stroke={T.muted} strokeWidth="1" />
          )}

          {series.map(s => {
            const i = hoverIdx ?? daily.length - 1;
            return (
              <circle key={`d-${s.key}`} cx={x(i)} cy={y(daily[i][s.key] ?? 0)} r="5"
                fill={s.color} stroke={T.surface} strokeWidth="2" />
            );
          })}
        </svg>

        {hoverIdx !== null && (
          <div style={{
            position: 'absolute', top: 0,
            left: `${(x(hoverIdx) / W) * 100}%`,
            transform: `translateX(${hoverIdx > daily.length / 2 ? '-105%' : '5%'})`,
            background: T.primary, color: '#fff', borderRadius: 10,
            padding: '8px 12px', pointerEvents: 'none', whiteSpace: 'nowrap',
          }}>
            <div style={{ ...mono, fontSize: '0.7rem', opacity: 0.7, marginBottom: 3 }}>
              {daily[hoverIdx].day}
            </div>
            {series.map(s => (
              <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.78rem' }}>
                <span style={{ width: 8, height: 8, borderRadius: 50, background: s.color }} />
                {s.title}: <strong style={mono}>{fmt(daily[hoverIdx][s.key] ?? 0)}</strong>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Table twin ──────────────────────────────────────────────────────────────
// The chart's WCAG-clean equivalent: every plotted value readable as text,
// so nothing is reachable only by hovering.
export function TrendTable({ daily, series }) {
  return (
    <div style={{ overflowX: 'auto', marginTop: 6 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
        <thead>
          <tr>
            <th style={th}>Дата</th>
            {series.map(s => <th key={s.key} style={{ ...th, textAlign: 'right' }}>{s.title}</th>)}
          </tr>
        </thead>
        <tbody>
          {daily.map(d => (
            <tr key={d.day}>
              <td style={{ ...td, ...mono }}>{d.day}</td>
              {series.map(s => (
                <td key={s.key} style={{ ...td, ...mono, textAlign: 'right', fontWeight: 600 }}>
                  {fmt(d[s.key] ?? 0)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const th = {
  textAlign: 'left', fontSize: '0.66rem', letterSpacing: '0.12em',
  textTransform: 'uppercase', color: T.muted, fontWeight: 700,
  padding: '0 12px 8px 0', borderBottom: '1.5px solid #DBE2EB', whiteSpace: 'nowrap',
};
const td = {
  padding: '8px 12px 8px 0', borderBottom: '1px solid #F2F5F9',
  color: T.secondary, whiteSpace: 'nowrap',
};
