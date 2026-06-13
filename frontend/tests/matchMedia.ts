/**
 * matchMedia mock for jsdom (which does not implement it).
 *
 * Installed globally from tests/setup.ts with every query matching by
 * default (desktop-like). Tests drive breakpoint changes through
 * `setMatchMedia`, which re-evaluates registered queries and fires their
 * change listeners — wrap calls in `act()` when components are mounted.
 */

type ChangeListener = (e: MediaQueryListEvent) => void;

interface RegisteredListener {
  readonly query: string;
  readonly listener: ChangeListener;
}

let matchesFn: (query: string) => boolean = () => true;
const listeners = new Set<RegisteredListener>();

export function installMatchMediaMock(): void {
  matchesFn = () => true;
  listeners.clear();

  window.matchMedia = (query: string): MediaQueryList =>
    ({
      get matches() {
        return matchesFn(query);
      },
      media: query,
      onchange: null,
      addEventListener: (_type: string, listener: ChangeListener) => {
        listeners.add({ query, listener });
      },
      removeEventListener: (_type: string, listener: ChangeListener) => {
        [...listeners]
          .filter((entry) => entry.listener === listener)
          .forEach((entry) => listeners.delete(entry));
      },
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}

export function setMatchMedia(fn: (query: string) => boolean): void {
  matchesFn = fn;
  listeners.forEach(({ query, listener }) =>
    listener({ matches: fn(query), media: query } as MediaQueryListEvent),
  );
}
