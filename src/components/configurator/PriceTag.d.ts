import * as React from "react";

export interface PriceTagProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Numeric amount (formatted by locale) or a ready string. */
  value: number | string;
  /** Strikethrough original price. */
  oldValue?: number | string;
  /** Currency suffix, or "before" for a leading $ . @default "₽" */
  currency?: string;
  /** Intl locale for grouping. @default "ru-RU" */
  locale?: string;
  /** Prefix with "от" (from). */
  from?: boolean;
  /** Size. @default "md" */
  size?: "sm" | "md" | "lg";
  /** Render the value in the ice accent colour. */
  accent?: boolean;
}

/** Formatted price display with optional "from", old price, and sizes. */
export function PriceTag(props: PriceTagProps): JSX.Element;
