import * as React from 'react';
export interface CrossProps {
  className?: string;
  style?: React.CSSProperties;
  color?: "black" | "dimgrey" | "grey" | "rederror" | "white";
}
export declare const Cross: React.FC<CrossProps>;
export default Cross;
