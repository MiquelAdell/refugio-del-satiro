import * as React from 'react';
export interface ViewSelectorProps {
  className?: string;
  style?: React.CSSProperties;
  view?: "grid" | "list";
  /** Swappable nested instance; defaults to the design's. */
  icon1?: React.ReactNode;
  /** Swappable nested instance; defaults to the design's. */
  icon2?: React.ReactNode;
}
export declare const ViewSelector: React.FC<ViewSelectorProps>;
export default ViewSelector;
