import * as React from 'react';
export interface GameImageProps {
  className?: string;
  style?: React.CSSProperties;
  game?: "diamant" | "pandemic_cthulhu" | "hanabi" | "mascarade" | "concept" | "nemesis" | "zodic_duel" | "7 wonders" | "speedcups" | "dominion" | "l'illa prohibida" | "anima" | "alien" | "azul" | "captainsonar";
  size?: "complete" | "square";
}
export declare const GameImage: React.FC<GameImageProps>;
export default GameImage;
