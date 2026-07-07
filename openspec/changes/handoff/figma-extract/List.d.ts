import * as React from 'react';
export interface ListProps {
  className?: string;
  style?: React.CSSProperties;
  color?: "white" | "black" | "accentcolor";
}
export declare const List: React.FC<ListProps>;
export default List;
