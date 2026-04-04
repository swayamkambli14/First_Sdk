/**
 * Resolves a dot-notation path against a context object.
 * Safely traverses nested objects — returns undefined if any segment is missing.
 * Supports array index access: "metadata.items.0.price"
 *
 * Examples:
 *   resolvePath("user.current_tier", ctx) → "gold"
 *   resolvePath("metadata.amount", ctx) → 75
 *   resolvePath("user.cumulative_metadata.purchase.amount", ctx) → 350
 *   resolvePath("missing.key", ctx) → undefined
 */
export function resolvePath(path: string, context: Record<string, unknown>): unknown {
  const segments = path.split('.');
  let current: unknown = context;

  for (const segment of segments) {
    if (current === null || current === undefined) {
      return undefined;
    }

    if (typeof current === 'object' && !Array.isArray(current)) {
      current = (current as Record<string, unknown>)[segment];
    } else if (Array.isArray(current)) {
      // Support numeric array index access
      const index = parseInt(segment, 10);
      if (isNaN(index)) return undefined;
      current = current[index];
    } else {
      // Primitive value — can't traverse further
      return undefined;
    }
  }

  return current;
}
