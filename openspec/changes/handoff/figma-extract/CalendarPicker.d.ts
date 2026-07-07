import * as React from 'react';
export interface CalendarPickerProps {
  className?: string;
  style?: React.CSSProperties;
  date?: "unselected" | "selected";
  calendar?: boolean;
  day?: "26-may" | "25-may";
  label?: string;
  /** Text content; defaults to "25/05/2024". */
  text1?: string;
  /** Swappable nested instance; defaults to the design's. */
  icon1?: React.ReactNode;
  /** Swappable nested instance; defaults to the design's. */
  icon2?: React.ReactNode;
}
export declare const CalendarPicker: React.FC<CalendarPickerProps>;
export default CalendarPicker;
