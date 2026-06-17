import * as React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Colour role. @default "neutral" */
  tone?: "neutral" | "accent" | "success" | "warning" | "danger" | "champagne";
  /** Show a leading status dot. */
  dot?: boolean;
  children: React.ReactNode;
}

/** Compact status or category label. */
export function Badge(props: BadgeProps): JSX.Element;
