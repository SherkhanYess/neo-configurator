Glass surface container — product cards, option tiles, info panels.

```jsx
<Card media={<img src="/ring.jpg"/>} interactive>
  <Badge tone="champagne">Premium</Badge>
  <h3>Кольцо «Аврора»</h3>
  <PriceTag value={189000} />
</Card>

<Card variant="solid" padding="lg">…</Card>
<Card interactive selected onClick={pick}>…</Card>
```

Variants: `glass` (default translucent), `solid`, `flat`. Set `interactive` for hover-lift and `selected` for the ice outline (option tiles in the configurator).
