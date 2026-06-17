import * as React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style. @default "primary" */
  variant?: "primary" | "secondary" | "ghost" | "outline";
  /** Control height. @default "md" */
  size?: "sm" | "md" | "lg";
  /** Stretch to fill the container width. */
  fullWidth?: boolean;
  /** Icon element rendered before the label. */
  iconLeft?: React.ReactNode;
  /** Icon element rendered after the label. */
  iconRight?: React.ReactNode;
  /** Render as a different element/component (e.g. "a"). @default "button" */
  as?: React.ElementType;
  children?: React.ReactNode;
}

/**
 * Primary action control — pill-shaped, available as solid ice (primary),
 * translucent glass (secondary), ghost, or outline.
 * @startingPoint section="Core" subtitle="Pill button — primary, secondary, ghost, outline" viewport="700x150"
 */
export function Button(props: ButtonProps): JSX.Element;
