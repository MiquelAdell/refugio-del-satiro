import * as React from 'react';
export interface ButtonProps {
  className?: string;
  style?: React.CSSProperties;
  buttonText?: string;
  type?: "filled" | "outline" | "disabled" | "noborder";
  state?: "default" | "hover";
  icon?: boolean;
  size?: "s" | "m";
  /** Swappable nested instance; defaults to the design's. */
  icon1?: React.ReactNode;
}
export declare const Button: React.FC<ButtonProps>;
export default Button;
