import * as React from "react";

export interface SegmentedOption {
  value: string;
  label: React.ReactNode;
}

export interface SegmentedControlProps {
  /** Options as strings or {value,label} objects. */
  options: Array<string | SegmentedOption>;
  /** Controlled selected value. */
  value?: string;
  /** Uncontrolled initial value. */
  defaultValue?: string;
  /** Called with the newly selected value. */
  onChange?: (value: string, e: React.MouseEvent) => void;
  /** Stretch to fill the container. */
  fullWidth?: boolean;
  className?: string;
}

/** Apple-style segmented control with a sliding ice thumb. */
export function SegmentedControl(props: SegmentedControlProps): JSX.Element;
