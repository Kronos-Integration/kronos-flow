export function stepsByStartupOrder(steps, inverse = false) {
  const comparator = (a, b) =>
    a.startupOrder > b.startupOrder
      ? 1
      : a.startupOrder < b.startupOrder ? -1 : 0;

  return Array.from(steps.values()).sort(
    (a, b) => (inverse ? comparator(b, a) : comparator(a, b))
  );
}
