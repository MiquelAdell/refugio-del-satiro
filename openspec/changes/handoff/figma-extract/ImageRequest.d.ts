import * as React from 'react';
export interface ImageRequestProps {
  className?: string;
  style?: React.CSSProperties;
  game?: "carcassonne 1" | "carcassonne 2" | "carcassonne 3" | "carcassonne 4" | "carcassone 5" | "fantasy world";
  size?: "complete" | "square";
}
export declare const ImageRequest: React.FC<ImageRequestProps>;
export default ImageRequest;
