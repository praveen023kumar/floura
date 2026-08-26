import { memo } from "react";

/**
 * A custom comparison function for React.memo that ignores function props (callbacks).
 * It strictly compares all non-function props.
 */
export function arePropsEqualIgnoreCallbacks<P extends object>(prevProps: P, nextProps: P): boolean {
  const prevKeys = Object.keys(prevProps) as Array<keyof P>;
  const nextKeys = Object.keys(nextProps) as Array<keyof P>;

  if (prevKeys.length !== nextKeys.length) return false;

  for (const key of prevKeys) {
    const prevVal = prevProps[key];
    const nextVal = nextProps[key];

    // Ignore callback/function props
    if (typeof prevVal === "function" && typeof nextVal === "function") {
      continue;
    }

    if (prevVal !== nextVal) {
      return false;
    }
  }

  return true;
}

/**
 * Wraps a component in React.memo with the custom ignore callbacks comparison function.
 */
export function memoWithData<C extends React.ComponentType<any>>(Component: C): C {
  return memo(Component, arePropsEqualIgnoreCallbacks) as any;
}
