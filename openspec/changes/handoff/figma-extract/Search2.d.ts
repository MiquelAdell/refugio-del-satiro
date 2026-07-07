import * as React from 'react';
export interface Search2Props {
  className?: string;
  style?: React.CSSProperties;
  state?: "placholder" | "search";
  placeholder?: string;
  inputText?: string;
  /** Swappable nested instance; defaults to the design's. */
  icon1?: React.ReactNode;
  /** Swappable nested instance; defaults to the design's. */
  icon2?: React.ReactNode;
}
export declare const Search2: React.FC<Search2Props>;
export default Search2;
