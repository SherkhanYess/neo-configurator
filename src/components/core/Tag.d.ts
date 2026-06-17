import * as React from "react";

export interface TagProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onSelect"> {
  /** Selected (pressed) state. */
  selected?: boolean;
  /** Leading icon element. */
  icon?: React.ReactNode;
  /** When provided, renders a × remove affordance. */
  onRemove?: (e: React.MouseEvent) => void;
  /** Set false for a non-clickable static chip. @default true */
  interactive?: boolean;
  children: React.ReactNode;
}

/** Selectable chip / filter pill — toggles, filters, removable selections. */
export function Tag(props: TagProps): JSX.Element;
