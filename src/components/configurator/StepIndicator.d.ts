import * as React from "react";

export interface StepIndicatorProps {
  /** Step labels (strings) or {label} objects. */
  steps: Array<string | { label: string }>;
  /** Zero-based index of the current step. @default 0 */
  current?: number;
  /** Makes steps clickable; called with the step index. */
  onStepClick?: (index: number) => void;
  className?: string;
}

/** Horizontal step indicator for the multi-step constructor flow. */
export function StepIndicator(props: StepIndicatorProps): JSX.Element;
