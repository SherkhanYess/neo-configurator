import * as React from "react";

export interface QuantityStepperProps {
  /** Controlled value. */
  value?: number;
  /** Uncontrolled initial value. @default 1 */
  defaultValue?: number;
  min?: number;
  max?: number;
  /** Called with the clamped new value. */
  onChange?: (value: number) => void;
  className?: string;
}

/** Compact −/＋ quantity stepper for cart and order lines. */
export function QuantityStepper(props: QuantityStepperProps): JSX.Element;
