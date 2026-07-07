import * as React from 'react';
export interface IconsProps {
  className?: string;
  style?: React.CSSProperties;
  icon?: "user" | "person circle" | "barchart vertical" | "barchart horizontal" | "question" | "question circle" | "dismiss" | "edit" | "delete" | "arrow right" | "arrow down";
  color?: "white" | "black" | "primary";
  state?: "empty" | "fill";
}
export declare const Icons: React.FC<IconsProps>;
export default Icons;
