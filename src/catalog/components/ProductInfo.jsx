import SpecsBlock from './SpecsBlock.jsx';
import Faq from './Faq.jsx';

// Всё, что раньше жило на отдельной странице заявки, теперь стоит прямо в
// карточке товара: срок, примерка, характеристики, сервис и ответы на вопросы.
//
// Отдельный компонент, а не копия в каждом экране: кольца и пусеты показывают
// один и тот же набор, и расхождение между ними читалось бы как небрежность.

export const EYEBROW = {
  fontSize: '0.64rem', fontWeight: 700, letterSpacing: '0.14em',
  textTransform: 'uppercase', color: '#5B81A1',
};

// Плашка с одним фактом. Две такие стоят сразу под выбором цвета золота —
// срок и возможность примерить решают больше, чем любой текст ниже.
function InfoRow({ title, value }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 2,
      border: '1.5px solid #E9EDF3', borderRadius: 16, padding: '12px 16px',
      background: '#fff',
    }}>
      <span style={{ ...EYEBROW, fontSize: '0.6rem' }}>{title}</span>
      <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#0b2040' }}>{value}</span>
    </div>
  );
}

export default function ProductInfo() {
  return (
    <>
      <div style={{ display: 'grid', gap: 10, marginTop: 20 }}>
        <InfoRow title="Срок изготовления" value="5–10 календарных дней" />
        <InfoRow title="Можно примерить вживую" value="Образцы в наличии в Алматы и Астане" />
      </div>

      <div style={{ marginTop: 28 }}>
        <SpecsBlock eyebrowStyle={EYEBROW} />
      </div>

      <section style={{ marginTop: 32 }}>
        <div style={EYEBROW}>Сервис</div>
        <h3 style={{
          fontFamily: '"Unbounded",sans-serif', fontWeight: 300,
          fontSize: '1.15rem', letterSpacing: '-0.02em', lineHeight: 1.35,
          margin: '8px 0 10px', color: '#0b2040',
        }}>
          Мы заботимся о вашем украшении всю его жизнь
        </h3>
        <ul style={{ margin: 0, paddingLeft: 18, color: '#1E3149', fontSize: '0.88rem', lineHeight: 1.65 }}>
          <li>Ультразвуковая чистка — бесплатно, пожизненно</li>
          <li>Повторное родирование — бесплатно</li>
          <li>Ремонт и вторая пара — по себестоимости работы мастера</li>
          <li>Каждый заказ по договору: 50% при заключении, 50% при получении</li>
        </ul>
      </section>

      <div style={{ marginTop: 32 }}>
        <Faq />
      </div>
    </>
  );
}
