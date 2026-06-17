import * as React from "react";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Control type. @default "checkbox" */
  type?: "checkbox" | "radio";
  /** Trailing label text. */
  label?: string;
}

/** Checkbox or radio control with the ice accent fill. Pass type="radio" for radios. */
export function Checkbox(props: CheckboxProps): JSX.Element;
