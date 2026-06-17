import * as React from "react";

export interface OptionSwatchProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Primary label (e.g. "Белое золото"). */
  label: string;
  /** Secondary line (e.g. "750 проба"). */
  sublabel?: string;
  /** Price delta string (e.g. "+12 000 ₽"). */
  price?: string;
  /** Fill colour for the visual (metal/colour swatches). */
  color?: string;
  /** Image URL for the visual (stone/cut photo). */
  image?: string;
  /** Icon element for the visual (cut shapes). */
  icon?: React.ReactNode;
  /** Visual shape. @default "circle" */
  shape?: "circle" | "rounded";
  /** Selected state — ice outline + glow + tick. */
  selected?: boolean;
}

/** Selectable option tile for the constructor (cut, stone, metal, setting). */
export function OptionSwatch(props: OptionSwatchProps): JSX.Element;
