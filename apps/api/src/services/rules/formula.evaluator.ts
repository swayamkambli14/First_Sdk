import { Parser } from 'expr-eval';
import { EvalContext } from '../../config/rules.types.js';
import { resolvePath } from './path.resolver.js';
import { env } from '../../config/env.js';
import logger from '../../utils/logger.js';

const parser = new Parser();

/**
 * Safely evaluates a formula string against the evaluation context.
 * Uses expr-eval library — NOT eval() — to prevent code injection.
 *
 * Formulas reference context paths: "metadata.amount * 3"
 * All path references are resolved to their values before evaluation.
 *
 * Returns 0 and logs a warning if the formula is invalid or produces NaN.
 * Caps the result at FORMULA_MAX_POINTS to prevent reward overflow exploits.
 */
export function evaluateFormula(formula: string, context: EvalContext): number {
  try {
    // Find all dot-notation path references in the formula
    // Matches patterns like: metadata.amount, user.current_points, etc.
    const pathPattern = /[a-zA-Z_][a-zA-Z0-9_.]*\.[a-zA-Z0-9_.]+/g;
    const paths = formula.match(pathPattern) ?? [];

    // Build a flat variable map for expr-eval
    // Replace dots with underscores since expr-eval doesn't support dot notation
    let resolvedFormula = formula;
    const variables: Record<string, number> = {};

    for (const pathStr of paths) {
      const value = resolvePath(pathStr, context as unknown as Record<string, unknown>);
      const varName = pathStr.replace(/\./g, '_');
      variables[varName] = typeof value === 'number' ? value : 0;
      // Replace the path reference with the safe variable name
      resolvedFormula = resolvedFormula.replace(pathStr, varName);
    }

    const result = parser.evaluate(resolvedFormula, variables);

    if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
      logger.warn('Formula produced invalid result', { formula, result });
      return 0;
    }

    // Cap at configured maximum to prevent reward overflow exploits
    const capped = Math.min(Math.floor(result), env.FORMULA_MAX_POINTS);
    if (capped !== Math.floor(result)) {
      logger.warn('Formula result capped at maximum', {
        formula,
        original: result,
        capped,
      });
    }

    return capped;
  } catch (err) {
    logger.warn('Formula evaluation failed', {
      formula,
      error: err instanceof Error ? err.message : String(err),
    });
    return 0;
  }
}
