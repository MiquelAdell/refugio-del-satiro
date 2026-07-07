import * as React from 'react';
export interface StarRateStaticProps {
  className?: string;
  style?: React.CSSProperties;
  stars?: "1" | "2" | "3" | "4" | "5";
  /** Swappable nested instance; defaults to the design's. */
  icon1?: React.ReactNode;
  /** Swappable nested instance; defaults to the design's. */
  icon2?: React.ReactNode;
  /** Swappable nested instance; defaults to the design's. */
  icon3?: React.ReactNode;
  /** Swappable nested instance; defaults to the design's. */
  icon4?: React.ReactNode;
}
export declare const StarRateStatic: React.FC<StarRateStaticProps>;
export default StarRateStatic;
