import * as React from 'react';
export interface TitleIconProps {
  className?: string;
  style?: React.CSSProperties;
  color?: "default" | "dimgrey" | "textcolor";
}
export declare const TitleIcon: React.FC<TitleIconProps>;
export default TitleIcon;
