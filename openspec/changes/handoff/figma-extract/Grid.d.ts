import * as React from 'react';
export interface GridProps {
  className?: string;
  style?: React.CSSProperties;
  color?: "white" | "black" | "accentcolor";
}
export declare const Grid: React.FC<GridProps>;
export default Grid;
