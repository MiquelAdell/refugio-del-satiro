import * as React from 'react';
export interface CalendarDateProps {
  className?: string;
  style?: React.CSSProperties;
  state?: "unavilable" | "avilable" | "selected" | "none";
  hover?: boolean;
  /** Text content; defaults to "1". */
  text1?: string;
}
export declare const CalendarDate: React.FC<CalendarDateProps>;
export default CalendarDate;
