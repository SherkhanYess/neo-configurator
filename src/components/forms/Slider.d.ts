import * as React from "react";

export interface SliderProps {
  /** Label shown top-left. */
  label?: string;
  /** Controlled value. Omit for uncontrolled (use defaultValue). */
  value?: number;
  /** Uncontrolled initial value. */
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  /** Called with the new numeric value. */
  onChange?: (value: number, e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Format the displayed value, e.g. v => `${v} ct`. */
  formatValue?: (value: number) => React.ReactNode;
  className?: string;
}

/** Range slider with a filled ice track — carat, budget, size. */
export function Slider(props: SliderProps): JSX.Element;
