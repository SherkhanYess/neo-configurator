import * as React from "react";

export interface DialogProps {
  /** Visibility. @default true */
  open?: boolean;
  /** Close handler — fires on scrim click and the × button. */
  onClose?: () => void;
  /** Heading. */
  title?: React.ReactNode;
  /** Sub-heading below the title. */
  description?: React.ReactNode;
  /** Footer node — usually a row of Buttons. */
  footer?: React.ReactNode;
  /** Max width (px number or CSS length). @default 480 */
  width?: number | string;
  children?: React.ReactNode;
}

/** Centered modal dialog over a blurred navy scrim. */
export function Dialog(props: DialogProps): JSX.Element;
