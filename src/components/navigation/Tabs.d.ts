import * as React from "react";

export interface TabItem {
  value: string;
  label: React.ReactNode;
  /** Optional trailing count. */
  count?: number;
}

export interface TabsProps {
  /** Tabs as strings or {value,label,count} objects. */
  tabs: Array<string | TabItem>;
  /** Controlled active value. */
  value?: string;
  /** Uncontrolled initial value. */
  defaultValue?: string;
  /** Called with the newly selected tab value. */
  onChange?: (value: string, e: React.MouseEvent) => void;
  className?: string;
}

/** Underline tab bar for switching between views. */
export function Tabs(props: TabsProps): JSX.Element;
