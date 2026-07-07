import * as React from 'react';
export interface CheckProps {
  className?: string;
  style?: React.CSSProperties;
  color?: "black" | "dimgrey" | "textcolor" | "greensuccess" | "white";
}
export declare const Check: React.FC<CheckProps>;
export default Check;
