import type { ActiveLoanItemType } from "../types/loan";

const THIRTY_DAYS_IN_MILLISECONDS = 30 * 24 * 60 * 60 * 1000;

export function getLoanDetailPath(
  itemType: ActiveLoanItemType,
  slug: string,
): string {
  const catalogPath = itemType === "boardgame" ? "juegos" : "rol";
  return `/${catalogPath}/${slug}`;
}

export function isLoanAtLeastThirtyDaysOld(
  borrowedAt: string,
  now = new Date(),
): boolean {
  const borrowedAtMilliseconds = Date.parse(borrowedAt);
  const nowMilliseconds = now.getTime();

  if (
    !Number.isFinite(borrowedAtMilliseconds) ||
    !Number.isFinite(nowMilliseconds) ||
    borrowedAtMilliseconds > nowMilliseconds
  ) {
    return false;
  }

  return (
    nowMilliseconds - borrowedAtMilliseconds >= THIRTY_DAYS_IN_MILLISECONDS
  );
}
