Range slider with a filled ice track — ideal for carat weight, budget, ring size.

```jsx
<Slider label="Вес камня" min={0.3} max={3} step={0.1}
        defaultValue={1} formatValue={v => `${v.toFixed(1)} кар`} />
<Slider label="Бюджет" min={50000} max={500000} step={5000}
        value={budget} onChange={setBudget}
        formatValue={v => v.toLocaleString('ru') + ' ₽'} />
```

Controlled (`value`+`onChange`) or uncontrolled (`defaultValue`). `formatValue` renders the readout.
