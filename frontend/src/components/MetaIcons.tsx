// Line-art meta icons (style-guide §6.1) shared by the catalog card and the
// game detail hero. Always render them next to a text label, never alone.

interface MetaIconProps {
  readonly className: string;
}

export function PlayersIcon({ className }: MetaIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <circle cx="16.5" cy="9.5" r="2.4" />
      <path d="M16 14.2c2.6.3 4.5 2 4.5 4.8" />
    </svg>
  );
}

export function ClockIcon({ className }: MetaIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}
