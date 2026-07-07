import * as React from 'react';
export interface IconButtonsProps {
  className?: string;
  style?: React.CSSProperties;
  type?: "outline" | "filled";
  icon?: "grid" | "list" | "order des" | "order asc";
  hover?: boolean;
  /** Swappable nested instance; defaults to the design's. */
  icon1?: React.ReactNode;
}
export declare const IconButtons: React.FC<IconButtonsProps>;
export default IconButtons;
