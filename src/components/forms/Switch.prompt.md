Toggle switch for binary settings.

```jsx
<Switch label="Гравировка внутри" defaultChecked />
<Switch checked={giftWrap} onChange={e => setGiftWrap(e.target.checked)} label="Подарочная упаковка" />
```

Active track uses the ice accent. Pass `label` for an inline caption.
