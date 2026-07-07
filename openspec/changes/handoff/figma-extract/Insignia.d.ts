import * as React from 'react';
export interface InsigniaProps {
  className?: string;
  style?: React.CSSProperties;
  type?: "winner" | "master" | "1" | "2" | "3" | "cthulhu" | "alien" | "dnd" | "vampiro" | "juegos de mesa";
}
export declare const Insignia: React.FC<InsigniaProps>;
export default Insignia;
