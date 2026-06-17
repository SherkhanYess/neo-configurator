Text input with label, inline icons, hint, and validation styling.

```jsx
<Input label="Имя" placeholder="Как к вам обращаться" />
<Input label="Email" iconLeft={<Mail/>} hint="Пришлём эскиз" />
<Input label="Размер кольца" error="Укажите размер от 14 до 23" />
```

Pass `error` to show the danger state. `iconLeft`/`iconRight` take ~18px Lucide SVGs.
