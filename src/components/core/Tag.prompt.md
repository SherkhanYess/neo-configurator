Selectable chip — filters, multi-select options, removable selections.

```jsx
<Tag selected onClick={toggle}>Круглая огранка</Tag>
<Tag icon={<Gem/>}>Принцесса</Tag>
<Tag onRemove={() => clear(id)}>Белое золото 750</Tag>
```

`selected` toggles the ice-tinted active state. `onRemove` adds a × button. Set `interactive={false}` for a read-only chip.
