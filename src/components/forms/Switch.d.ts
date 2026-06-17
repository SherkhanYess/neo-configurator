import * as React from "react";

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** Controlled checked state. */
  checked?: boolean;
  /** Uncontrolled initial state. */
  defaultChecked?: boolean;
  /** Optional trailing label. */
  label?: string;
}

/** On/off toggle switch with the ice accent active track. */
export function Switch(props: SwitchProps): JSX.Element;
