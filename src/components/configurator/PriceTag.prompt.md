Formatted price display with ru-RU grouping, "from" prefix, old price, and sizes.

```jsx
<PriceTag value={189000} />                       // 189 000 ₽
<PriceTag from value={94500} size="lg" accent />  // от 94 500 ₽ (display size)
<PriceTag value={129000} oldValue={159000} />     // with strikethrough
```

`size="lg"` switches the value to the Jost display face — use it for the configurator total. Pass a string `value` for pre-formatted amounts.
