Centered modal dialog over a blurred navy scrim.

```jsx
<Dialog
  open={open}
  onClose={() => setOpen(false)}
  title="Сохранить эскиз?"
  description="Мы пришлём ссылку на вашу сборку"
  footer={<>
    <Button variant="ghost" onClick={close}>Не сейчас</Button>
    <Button variant="primary" onClick={save}>Сохранить</Button>
  </>}
>
  Ваша сборка кольца будет доступна по личной ссылке в течение 30 дней.
</Dialog>
```

Scrim click and × both call `onClose`. Footer is typically a right-aligned Button row.
