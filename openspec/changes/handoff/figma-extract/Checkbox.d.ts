import * as React from 'react';
export interface CheckboxProps {
  className?: string;
  style?: React.CSSProperties;
  state?: "unchecked" | "checked" | "unchecked counter" | "checke counter";
  /** Swappable nested instance; defaults to the design's. */
  icon1?: React.ReactNode;
}
export declare const Checkbox: React.FC<CheckboxProps>;
export default Checkbox;
