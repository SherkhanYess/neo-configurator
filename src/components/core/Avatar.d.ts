import * as React from "react";

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Image URL. Falls back to initials when absent. */
  src?: string;
  /** Full name — used for the alt text and initials fallback. */
  name?: string;
  /** Size. @default "md" */
  size?: "xs" | "sm" | "md" | "lg";
  /** Show an online status dot. */
  status?: boolean;
}

/** User or studio avatar with image or initials fallback. */
export function Avatar(props: AvatarProps): JSX.Element;
