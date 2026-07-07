import * as React from 'react';
export interface InsigniaCompleteProps {
  className?: string;
  style?: React.CSSProperties;
  title?: string;
  description?: string;
  state?: "hover" | "default" | "shown" | "spotlight";
  /** Swappable nested instance; defaults to the design's. */
  icon1?: React.ReactNode;
}
export declare const InsigniaComplete: React.FC<InsigniaCompleteProps>;
export default InsigniaComplete;
