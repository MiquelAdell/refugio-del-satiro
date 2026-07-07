import * as React from 'react';
export interface DatePickerProps {
  className?: string;
  style?: React.CSSProperties;
  state?: "default" | "25-may" | "26-may";
  /** Text content; defaults to "Mayo". */
  text1?: string;
  /** Text content; defaults to "2024". */
  text2?: string;
  /** Text content; defaults to "Lun". */
  text3?: string;
  /** Text content; defaults to "Mar". */
  text4?: string;
  /** Swappable nested instance; defaults to the design's. */
  icon1?: React.ReactNode;
  /** Swappable nested instance; defaults to the design's. */
  icon2?: React.ReactNode;
  /** Swappable nested instance; defaults to the design's. */
  icon3?: React.ReactNode;
  /** Swappable nested instance; defaults to the design's. */
  icon4?: React.ReactNode;
}
export declare const DatePicker: React.FC<DatePickerProps>;
export default DatePicker;
