import { ConditionGroup, SingleCondition, EvalContext, isConditionGroup } from '../../config/rules.types.js';
import { resolvePath } from './path.resolver.js';
import logger from '../../utils/logger.js';

/**
 * Evaluates a ConditionGroup (AND/OR) against the evaluation context.
 * Supports nested condition groups for complex logic like:
 *   AND [ amount > 100, OR [ tier == gold, tier == platinum ] ]
 */
export function evaluateConditions(
  conditions: ConditionGroup,
  context: EvalContext
): boolean {
  const results = conditions.checks.map((check) => {
    if (isConditionGroup(check)) {
      // Recursively evaluate nested condition group
      return evaluateConditions(check, context);
    }
    return evaluateSingleCondition(check, context);
  });

  return conditions.operator === 'AND'
    ? results.every(Boolean)
    : results.some(Boolean);
}

/**
 * Evaluates a single condition check against the context.
 * Implements all operators from TRD Section 7.2.
 */
function evaluateSingleCondition(
  check: SingleCondition,
  context: EvalContext
): boolean {
  // Resolve the field value using dot-notation path
  const resolved = resolvePath(check.field, context as unknown as Record<string, unknown>);

  logger.debug('Condition check', {
    field: check.field,
    op: check.op,
    expected: check.value,
    actual: resolved,
  });

  switch (check.op) {
    case '==':
      return resolved === check.value;

    case '!=':
      return resolved !== check.value;

    case '>':
      return typeof resolved === 'number' && resolved > Number(check.value);

    case '>=':
      return typeof resolved === 'number' && resolved >= Number(check.value);

    case '<':
      return typeof resolved === 'number' && resolved < Number(check.value);

    case '<=':
      return typeof resolved === 'number' && resolved <= Number(check.value);

    case 'in':
      return Array.isArray(check.value) && check.value.includes(resolved);

    case 'not_in':
      return Array.isArray(check.value) && !check.value.includes(resolved);

    case 'contains':
      return typeof resolved === 'string' && resolved.includes(String(check.value));

    case 'starts_with':
      return typeof resolved === 'string' && resolved.startsWith(String(check.value));

    case 'exists':
      return resolved !== undefined && resolved !== null;

    default:
      logger.warn(`Unknown condition operator: ${check.op as string}`);
      return false;
  }
}
