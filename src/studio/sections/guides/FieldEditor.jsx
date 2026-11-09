import { useRef, useState } from 'react';
import { readImage, compress } from '../../image.js';
import { uploadImage } from '../../api.js';
import { Button, Field, Svg, Toggle, useToast } from '../../ui.jsx';
import { moveItem } from '../../sortable.js';

// Форма по схеме блока (src/catalog/data/guideSchema.js): одно описание
// полей — и сайт, и сервер, и эта форма знают, что у блока внутри. Новый блок
// в схеме сразу получает форму без кода здесь.

async function uploadFile(file) {
  if (!file.type.startsWith('image/') && !/\.(heic|heif)$/i.test(file.name)) throw new Error('Это не картинка. Нужен JPEG, PNG, WebP или HEIC.');
  const img = await readImage(file);
  const { blob, width, height } = await compress(img);
  return uploadImage(blob, { width, height });
}

function ImageInput({ value, onChange, label }) {
  const toast = useToast();
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  async function pick(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try { onChange(await uploadFile(file)); toast('Фото загружено'); }
    catch (err) { toast(err.message || 'Не удалось загрузить фото', 'error'); }
    finally { setBusy(false); }
  }
  return (
    <div className="st-gimg">
      <button type="button" className="st-gimg__thumb" onClick={() => input.current?.click()} aria-label={`${label}: выбрать фото`}>
        {value ? <img src={value} alt="" /> : <Svg name="photo" size={22} />}
      </button>
      <div className="st-gimg__side">
        <Button variant="secondary" size="s" busy={busy} onClick={() => input.current?.click()}>{value ? 'Заменить' : 'Загрузить фото'}</Button>
        {value && <Button variant="ghost" size="s" onClick={() => onChange('')}>Убрать</Button>}
      </div>
      <input ref={input} type="file" accept="image/*,.heic,.heif" hidden onChange={pick} />
    </div>
  );
}

function ListControls({ i, count, onMove, onRemove }) {
  return (
    <div className="st-row st-row--tight">
      <Button variant="icon" onClick={() => onMove(i, i - 1)} disabled={i === 0} aria-label="Выше"><Svg name="up" /></Button>
      <Button variant="icon" onClick={() => onMove(i, i + 1)} disabled={i === count - 1} aria-label="Ниже"><Svg name="down" /></Button>
      <Button variant="icon" onClick={() => onRemove(i)} aria-label="Удалить"><Svg name="trash" /></Button>
    </div>
  );
}

function blankOf(fields) {
  return Object.fromEntries(Object.entries(fields).map(([k, f]) => [k,
    f.kind === 'bool' ? false : f.kind === 'num' ? f.min : f.kind === 'select' ? f.options[0][0]
      : ['strings', 'list', 'images', 'multiselect'].includes(f.kind) ? [] : '']));
}

/** Одно поле. Вложенные списки рисуют сами себя тем же компонентом. */
export function FieldInput({ f, value, onChange }) {
  switch (f.kind) {
    case 'text':
    case 'link':
      return (
        <Field label={f.label} hint={f.hint}>
          <input className="st-input" value={value ?? ''} maxLength={f.max ?? 300} placeholder={f.kind === 'link' ? '/product/…' : undefined}
                 onChange={e => onChange(e.target.value)} />
        </Field>
      );
    case 'area':
      return (
        <Field label={f.label} hint={f.hint}>
          <textarea className="st-input st-textarea" rows={Math.min(8, Math.max(2, Math.ceil(String(value ?? '').length / 60)))}
                    value={value ?? ''} maxLength={f.max} onChange={e => onChange(e.target.value)} />
        </Field>
      );
    case 'num':
      return (
        <Field label={f.label} hint={f.hint}>
          <input className="st-input" type="number" inputMode="numeric" min={f.min} max={f.max} value={value ?? ''}
                 onChange={e => onChange(e.target.value === '' ? undefined : Number(e.target.value))} />
        </Field>
      );
    case 'bool':
      return (
        <div className="st-switchrow">
          <div><b>{f.label}</b>{f.hint && <small>{f.hint}</small>}</div>
          <Toggle on={value === true} onChange={onChange} label={f.label} />
        </div>
      );
    case 'select':
      return (
        <Field label={f.label} hint={f.hint}>
          <select className="st-input" value={value ?? f.options[0][0]} onChange={e => onChange(e.target.value)}>
            {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
      );
    case 'multiselect': {
      const set = new Set(value ?? []);
      return (
        <div className="st-field">
          <span className="st-field__label">{f.label}</span>
          <div className="st-chips">
            {f.options.map(([v, l]) => (
              <button key={v} type="button" className={`st-chip${set.has(v) ? ' is-on' : ''}`} aria-pressed={set.has(v)}
                      onClick={() => { const n = new Set(set); if (n.has(v)) n.delete(v); else n.add(v); onChange([...n]); }}>{l}</button>
            ))}
          </div>
        </div>
      );
    }
    case 'image':
      return <div className="st-field"><span className="st-field__label">{f.label}</span><ImageInput value={value} onChange={onChange} label={f.label} />{f.hint && <span className="st-field__hint">{f.hint}</span>}</div>;
    case 'images': {
      const arr = Array.from({ length: f.count }, (_, i) => (value ?? [])[i] ?? '');
      return (
        <div className="st-field">
          <span className="st-field__label">{f.label}</span>
          <div className="st-gimgs">
            {arr.map((v, i) => <ImageInput key={i} value={v} label={`${f.label} ${i + 1}`} onChange={nv => onChange(arr.map((x, j) => (j === i ? nv : x)))} />)}
          </div>
        </div>
      );
    }
    case 'strings': {
      const arr = value ?? [];
      return (
        <div className="st-field">
          <span className="st-field__label">{f.label}</span>
          <div className="st-glist">
            {arr.map((v, i) => (
              <div key={i} className="st-glist__row">
                <textarea className="st-input st-textarea" rows={Math.max(1, Math.ceil(v.length / 52))} value={v} maxLength={f.max}
                          onChange={e => onChange(arr.map((x, j) => (j === i ? e.target.value : x)))} />
                <ListControls i={i} count={arr.length} onMove={(a, b) => onChange(moveItem(arr, a, b))} onRemove={(k) => onChange(arr.filter((_, j) => j !== k))} />
              </div>
            ))}
            {arr.length < (f.count ?? 24) && <Button variant="ghost" size="s" onClick={() => onChange([...arr, ''])}><Svg name="plus" size={15} />Добавить пункт</Button>}
          </div>
        </div>
      );
    }
    case 'list': {
      const arr = value ?? [];
      return (
        <div className="st-field">
          <span className="st-field__label">{f.label}</span>
          <div className="st-glist">
            {arr.map((v, i) => (
              <div key={i} className="st-gsub">
                <div className="st-gsub__head">
                  <span className="st-eyebrow">{i + 1}</span>
                  <ListControls i={i} count={arr.length} onMove={(a, b) => onChange(moveItem(arr, a, b))} onRemove={(k) => onChange(arr.filter((_, j) => j !== k))} />
                </div>
                <Fields fields={f.fields} value={v} onChange={nv => onChange(arr.map((x, j) => (j === i ? nv : x)))} />
              </div>
            ))}
            {arr.length < (f.count ?? 12) && <Button variant="ghost" size="s" onClick={() => onChange([...arr, blankOf(f.fields)])}><Svg name="plus" size={15} />Добавить</Button>}
          </div>
        </div>
      );
    }
    default:
      return null;
  }
}

/** Все поля записи по схеме. */
export function Fields({ fields, value, onChange }) {
  return (
    <div className="st-gfields">
      {Object.entries(fields).map(([k, f]) => (
        <FieldInput key={k} f={f} value={value?.[k]} onChange={v => onChange({ ...value, [k]: v })} />
      ))}
    </div>
  );
}
