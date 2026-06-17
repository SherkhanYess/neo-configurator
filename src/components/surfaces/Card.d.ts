import * as React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Surface style. @default "glass" */
  variant?: "glass" | "solid" | "flat";
  /** Body padding. @default "md" */
  padding?: "sm" | "md" | "lg";
  /** Adds hover-lift affordance. */
  interactive?: boolean;
  /** Selected outline + ice glow (use with interactive option cards). */
  selected?: boolean;
  /** Media element rendered in a fixed-ratio header (e.g. <img> or <image-slot>). */
  media?: React.ReactNode;
  /** CSS aspect-ratio for the media area. @default "4/3" */
  mediaRatio?: string;
  /** Props spread onto the inner body wrapper. */
  bodyProps?: React.HTMLAttributes<HTMLDivElement>;
  children?: React.ReactNode;
}

/**
 * Glass surface container — product cards, panels, option tiles.
 * @startingPoint section="Surfaces" subtitle="Glass card with media, selectable & interactive states" viewport="700x320"
 */
export function Card(props: CardProps): JSX.Element;
