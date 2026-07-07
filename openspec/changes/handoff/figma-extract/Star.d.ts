import * as React from 'react';
export interface StarProps {
  className?: string;
  style?: React.CSSProperties;
  filled?: "no" | "yes" | "semi" | "over";
  withHover?: boolean;
}
export declare const Star: React.FC<StarProps>;
export default Star;
