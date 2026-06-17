import * as React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Field label rendered above the control. */
  label?: string;
  /** Helper text below the field. */
  hint?: string;
  /** Error message — also flips the field to the invalid style. */
  error?: string;
  /** Icon element shown inside, on the left. */
  iconLeft?: React.ReactNode;
  /** Icon element shown inside, on the right. */
  iconRight?: React.ReactNode;
}

/** Text input with optional label, inline icons, hint and validation. */
export function Input(props: InputProps): JSX.Element;
