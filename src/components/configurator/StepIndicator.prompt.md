Horizontal progress stepper for the Neo Diamond constructor (cut → stone → metal → setting → engraving).

```jsx
<StepIndicator current={2} onStepClick={goToStep}
  steps={["Огранка","Камень","Металл","Оправа","Гравировка"]} />
```

Completed steps show a check, the current step glows ice. Provide `onStepClick` to let users jump back to a finished step.
