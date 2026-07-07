import * as React from 'react';
export interface InputProps {
  className?: string;
  style?: React.CSSProperties;
  label?: string;
  state?: "bar" | "input" | "defaul" | "nobar" | "image default" | "image input" | "default multiline" | "input multiline";
  /** Text content; defaults to "|". */
  text1?: string;
  /** Swappable nested instance; defaults to the design's. */
  icon1?: React.ReactNode;
  /** Swappable nested instance; defaults to the design's. */
  icon2?: React.ReactNode;
}
export declare const Input: React.FC<InputProps>;
export default Input;
