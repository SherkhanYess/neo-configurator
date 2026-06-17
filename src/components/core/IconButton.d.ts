import * as React from "react";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style. @default "glass" */
  variant?: "glass" | "ghost" | "solid";
  /** Size. @default "md" */
  size?: "sm" | "md" | "lg";
  /** Accessible label (required — the button has no text). */
  label: string;
  /** The icon element (e.g. a Lucide SVG). */
  children: React.ReactNode;
}

/** Circular icon-only control for toolbars, headers and cards. */
export function IconButton(props: IconButtonProps): JSX.Element;
