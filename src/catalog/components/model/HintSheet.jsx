import { useState } from 'react';
import { track, EVENTS } from '../../lib/track.js';

// «Намекнуть партнёру». По CJM она выбирает кольцо, но не покупает: форма
// превращает её интерес в лид на него. Берём только его имя и номер и её
// размер. Размер ему не отправляем — чтобы узнать его, он напишет нам сам.

export default function HintSheet({ ring, link, code, city, onClose }) {
  const [name, setName]       = useState('');
  const [phone, setPhone]     = useState('');
  const [size, setSize]       = useState('');
  const [noSize, setNoSize]   = useState(false);
  const [state, setState]     = useState('form'); // form | sending | done
  const [error, setError]     = useState('');

  const digits = phone.replace(/\D/g, '');
  const ready  = name.trim() && digits.length >= 10 && (noSize || size.trim());

  async function submit(e) {
    e.preventDefault();
    if (!ready || state === 'sending') return;
    setState('sending'); setError('');
    try {
      const res = await fetch('/api/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, size, sizeUnknown: noSize, ring, link, code, city }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState('form');
        setError(data.error === 'phone' ? 'Проверьте номер: нужен казахстанский, 10 или 11 цифр.'
          : data.error === 'size' ? 'Размер — число от 14 до 24, например 16,5.'
          : 'Не получилось отправить. Попробуйте ещё раз.');
        return;
      }
      track(EVENTS.HINT_SUBMIT, { ring, sizeKnown: !noSize });
      setState('done');
    } catch {
      setState('form');
      setError('Нет связи. Проверьте интернет и попробуйте ещё раз.');
    }
  }

  return (
    <div className="mp-sheet-bg" role="dialog" aria-modal="true" aria-label="Намекнуть партнёру" onClick={onClose}>
      <form className="mp-sheet" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div className="mp-sheet__grip" />
        {state === 'done' ? (
          <>
            <div className="mp-sheet__t">Намёк отправлен</div>
            <p className="mp-sheet__p">Напишем ему в WhatsApp в ближайшее время. О заказе вам не расскажем — сюрприз останется сюрпризом.</p>
            <button type="button" className="mp-submit" onClick={onClose}>Готово</button>
          </>
        ) : (
          <>
            <div className="mp-sheet__t">Намекнуть партнёру</div>
            <p className="mp-sheet__p">Напишем ему в WhatsApp, что вам понравилось это кольцо. Один раз, без звонков.</p>
            <div className="mp-ring"><b>{ring}</b></div>
            <div className="mp-fields">
              <label className="mp-field"><span>Его имя</span>
                <input value={name} onChange={e => setName(e.target.value)} autoComplete="off" maxLength={60} />
              </label>
              <label className="mp-field"><span>Его WhatsApp</span>
                <input value={phone} onChange={e => setPhone(e.target.value)} type="tel" inputMode="tel" placeholder="+7 ___ ___ __ __" autoComplete="off" />
              </label>
            </div>
            <div className="mp-size">
              <div className="mp-size__row">
                <label className="mp-field"><span>Мой размер кольца</span>
                  <input value={noSize ? '' : size} onChange={e => { setSize(e.target.value); setNoSize(false); }}
                         inputMode="decimal" placeholder="16,5" disabled={noSize} />
                </label>
                <button type="button" className={`mp-size__no${noSize ? ' is-active' : ''}`} aria-pressed={noSize}
                        onClick={() => { setNoSize(v => !v); setSize(''); }}>
                  Не знаю размер
                </button>
              </div>
            </div>
            {error && <p className="mp-err" role="alert">{error}</p>}
            <button type="submit" className="mp-submit" disabled={!ready || state === 'sending'}>
              {state === 'sending' ? 'Отправляем…' : 'Отправить намёк'}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
