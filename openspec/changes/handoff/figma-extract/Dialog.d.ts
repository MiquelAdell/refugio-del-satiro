import * as React from 'react';
export interface DialogProps {
  className?: string;
  style?: React.CSSProperties;
  description?: string;
  title?: string;
  starRate?: React.ReactNode;
  type?: "action" | "solicitar préstamo" | "solicitar juego" | "action + close" | "confirmar préstamo" | "añadir insignia" | "añadir código insignia" | "cancelar préstamo" | "confirm sinc" | "success" | "error" | "confirm delete" | "confirm reserved" | "return game";
  breakpoint?: "desktop";
  datePicker?: React.ReactNode;
  /** Text content; defaults to "¡Hola!, tenías una reserva hoy...". */
  text1?: string;
  /** Text content; defaults to "Diamant". */
  text2?: string;
  /** Text content; defaults to "Fantasy World". */
  text3?: string;
  /** Swappable nested instance; defaults to the design's. */
  icon1?: React.ReactNode;
  /** Swappable nested instance; defaults to the design's. */
  icon2?: React.ReactNode;
}
export declare const Dialog: React.FC<DialogProps>;
export default Dialog;
