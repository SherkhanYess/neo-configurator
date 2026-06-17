Underline tab bar for switching between content views or catalog sections.

```jsx
<Tabs defaultValue="rings" onChange={setView}
  tabs={[
    {value:'rings', label:'Кольца', count:128},
    {value:'earrings', label:'Серьги', count:64},
    {value:'pendants', label:'Подвески'},
  ]} />
```

Controlled (`value`+`onChange`) or uncontrolled (`defaultValue`). For 2–4 mutually exclusive filters prefer SegmentedControl.
