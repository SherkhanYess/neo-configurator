Segmented control — single-select among 2–4 short options, with a sliding ice thumb.

```jsx
<SegmentedControl options={["Кольца","Серьги","Подвески"]} defaultValue="Кольца" />
<SegmentedControl fullWidth value={metal} onChange={setMetal}
  options={[{value:'wg',label:'Белое'},{value:'yg',label:'Жёлтое'},{value:'pt',label:'Платина'}]} />
```

Keep labels short. Use `fullWidth` inside panels. For many/long options use a Select instead.
