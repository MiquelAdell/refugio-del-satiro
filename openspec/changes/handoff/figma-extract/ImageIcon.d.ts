import * as React from 'react';
export interface ImageIconProps {
  className?: string;
  style?: React.CSSProperties;
  color?: "black" | "dimgrey" | "textcolor";
}
export declare const ImageIcon: React.FC<ImageIconProps>;
export default ImageIcon;
