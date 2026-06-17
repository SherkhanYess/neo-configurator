The core constructor control — a selectable tile for a cut, stone, metal, or setting choice.

```jsx
// Metal colour swatches
<OptionSwatch label="Белое золото" sublabel="750" color="#E8ECF1" selected />
<OptionSwatch label="Розовое золото" sublabel="585" color="#E7C3B0" price="+8 000 ₽" />

// Cut shapes (icon) or stone photos (image)
<OptionSwatch label="Круглая" icon={<Gem/>} selected />
<OptionSwatch label="Овал" image="/cut-oval.png" shape="rounded" />
```

Use `color` for metal swatches, `image` for photos, `icon` for cut shapes. `selected` shows the ice outline + tick. Lay out in a responsive grid (3–4 across).
