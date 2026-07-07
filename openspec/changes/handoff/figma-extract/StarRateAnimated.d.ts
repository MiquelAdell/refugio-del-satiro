import * as React from 'react';
export interface StarRateAnimatedProps {
  className?: string;
  style?: React.CSSProperties;
  stars?: "5" | "1" | "2" | "3" | "4";
}
export declare const StarRateAnimated: React.FC<StarRateAnimatedProps>;
export default StarRateAnimated;
