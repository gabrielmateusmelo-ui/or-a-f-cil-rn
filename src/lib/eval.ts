import { Parser } from 'expr-eval';

const parser = new Parser();

export function safeEval(expression: string, variables: Record<string, number>): { value: number; error?: string } {
  try {
    const expr = parser.parse(expression);
    const result = expr.evaluate(variables);
    if (typeof result !== 'number' || !isFinite(result) || isNaN(result)) {
      return { value: 0, error: `Resultado inválido: ${result}` };
    }
    return { value: Math.max(0, result) };
  } catch (e: any) {
    return { value: 0, error: e.message || 'Erro na expressão' };
  }
}
