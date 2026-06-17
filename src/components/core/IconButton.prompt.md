Circular icon-only button — toolbars, card actions, close buttons, favourites.

```jsx
<IconButton label="В избранное" variant="glass"><Heart/></IconButton>
<IconButton label="Закрыть" variant="ghost" size="sm"><X/></IconButton>
```

Always pass `label` for accessibility. Variants: `glass` (default translucent), `ghost`, `solid` (ice). Icons should be ~20px Lucide SVGs.
