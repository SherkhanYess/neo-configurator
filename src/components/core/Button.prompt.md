Pill-shaped primary action control for Neo Diamond — use for any tap target that triggers an action.

```jsx
<Button variant="primary" onClick={start}>Собрать украшение</Button>
<Button variant="secondary" iconLeft={<Gem/>}>Выбрать огранку</Button>
<Button variant="ghost" size="sm">Отмена</Button>
<Button variant="outline">Подробнее</Button>
```

Variants: `primary` (solid ice, soft glow — one per view), `secondary` (translucent glass, the default neutral action), `ghost` (text-only), `outline` (ice border). Sizes: `sm` / `md` / `lg`. Use `fullWidth` in narrow panels and the configurator footer. Pass `as="a"` with `href` for links styled as buttons.
