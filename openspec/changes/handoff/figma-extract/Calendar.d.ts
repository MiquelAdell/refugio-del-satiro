import * as React from 'react';
export interface CalendarProps {
  className?: string;
  style?: React.CSSProperties;
  color?: "black" | "dimgrey";
}
export declare const Calendar: React.FC<CalendarProps>;
export default Calendar;
