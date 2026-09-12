interface Described {
  readonly description: string;
  readonly description_es: string;
}

/**
 * Spanish description when a translation exists, falling back to the English
 * BGG source text — the site never hides a description because its
 * translation is missing.
 */
export function displayDescription(item: Described): string {
  return item.description_es || item.description;
}
