/**
 * Calculations Engine
 * Provides functions for custom formula calculations on chart data
 */

export interface CalculationFormula {
  name: string;
  expression: string;
  description?: string;
}

export interface CalculationContext {
  [key: string]: number | string | Date | boolean | null | undefined;
}

/**
 * Parse and evaluate a calculation formula
 * Supports basic math operations and common functions
 */
export function evaluateFormula(formula: string, context: CalculationContext): number {
  try {
    // Replace variable names with their values from context
    let expression = formula;
    
    // Extract variables from formula (words that match context keys)
    const variables = Object.keys(context).filter(key => 
      expression.includes(key) && typeof context[key] === 'number'
    );
    
    for (const variable of variables) {
      const value = context[variable] as number;
      // Replace variable name with its value (handle word boundaries)
      const regex = new RegExp(`\\b${variable}\\b`, 'g');
      expression = expression.replace(regex, String(value));
    }

    // Replace common function names
    expression = expression
      .replace(/\bSUM\b/g, 'sum')
      .replace(/\bAVG\b/g, 'avg')
      .replace(/\bCOUNT\b/g, 'count')
      .replace(/\bMIN\b/g, 'min')
      .replace(/\bMAX\b/g, 'max')
      .replace(/\bABS\b/g, 'Math.abs')
      .replace(/\bROUND\b/g, 'Math.round')
      .replace(/\bFLOOR\b/g, 'Math.floor')
      .replace(/\bCEIL\b/g, 'Math.ceil')
      .replace(/\bSQRT\b/g, 'Math.sqrt')
      .replace(/\bPOW\b/g, 'Math.pow')
      .replace(/\bLOG\b/g, 'Math.log')
      .replace(/\bEXP\b/g, 'Math.exp')
      .replace(/\bSIN\b/g, 'Math.sin')
      .replace(/\bCOS\b/g, 'Math.cos')
      .replace(/\bTAN\b/g, 'Math.tan');

    // Evaluate the expression
    // Using Function constructor for safe evaluation (in production, use a proper expression parser)
    const result = new Function('Math', `return ${expression}`)(Math);
    
    if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
      throw new Error('Invalid calculation result');
    }
    
    return result;
  } catch (error) {
    console.error('Error evaluating formula:', error);
    throw new Error(`خطا در محاسبه فرمول: ${(error as Error).message}`);
  }
}

/**
 * Apply calculation to an array of data points
 */
export function applyCalculation(
  data: Record<string, unknown>[],
  formula: string,
  resultKey: string = 'calculated'
): Record<string, unknown>[] {
  return data.map(item => {
    const context: CalculationContext = {};
    
    // Convert item to context
    Object.keys(item).forEach(key => {
      const value = item[key];
      if (typeof value === 'number') {
        context[key] = value;
      }
    });

    try {
      const result = evaluateFormula(formula, context);
      return {
        ...item,
        [resultKey]: result
      };
    } catch (error) {
      console.error('Error applying calculation:', error);
      return {
        ...item,
        [resultKey]: null
      };
    }
  });
}

/**
 * Common calculation formulas
 */
export const CommonFormulas: Record<string, CalculationFormula> = {
  profitMargin: {
    name: 'حاشیه سود',
    expression: '(profit / revenue) * 100',
    description: 'درصد سود نسبت به درآمد'
  },
  growthRate: {
    name: 'نرخ رشد',
    expression: '((current - previous) / previous) * 100',
    description: 'درصد رشد نسبت به دوره قبل'
  },
  average: {
    name: 'میانگین',
    expression: '(value1 + value2 + value3) / 3',
    description: 'میانگین سه مقدار'
  },
  weightedAverage: {
    name: 'میانگین وزنی',
    expression: '(value1 * weight1 + value2 * weight2) / (weight1 + weight2)',
    description: 'میانگین وزنی دو مقدار'
  },
  percentage: {
    name: 'درصد',
    expression: '(part / total) * 100',
    description: 'درصد یک بخش نسبت به کل'
  },
  ratio: {
    name: 'نسبت',
    expression: 'value1 / value2',
    description: 'نسبت دو مقدار'
  },
  compoundGrowth: {
    name: 'رشد مرکب',
    expression: 'POW((current / previous), (1 / periods)) - 1',
    description: 'نرخ رشد مرکب'
  }
};

/**
 * Validate formula syntax
 */
export function validateFormula(formula: string, availableVariables: string[]): { valid: boolean; error?: string } {
  try {
    // Check for dangerous code
    const dangerousPatterns = [
      /eval\s*\(/i,
      /function\s*\(/i,
      /new\s+Function/i,
      /\.constructor/i,
      /__proto__/i,
      /prototype/i
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(formula)) {
        return { valid: false, error: 'فرمول حاوی کد خطرناک است' };
      }
    }

    // Check if all variables are available
    const variablePattern = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
    const matches = formula.match(variablePattern);
    if (matches) {
      const usedVariables = Array.from(new Set(matches));
      const invalidVariables = usedVariables.filter(v => 
        !availableVariables.includes(v) && 
        !['Math', 'sum', 'avg', 'count', 'min', 'max'].includes(v) &&
        !/^\d+$/.test(v) // Not a number
      );
      
      if (invalidVariables.length > 0) {
        return { 
          valid: false, 
          error: `متغیرهای نامعتبر: ${invalidVariables.join(', ')}` 
        };
      }
    }

    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      error: `خطا در بررسی فرمول: ${(error as Error).message}` 
    };
  }
}

/**
 * Get available variables from data
 */
export function getAvailableVariables(data: Record<string, unknown>[]): string[] {
  if (data.length === 0) return [];
  
  const variables = new Set<string>();
  data.forEach(item => {
    Object.keys(item).forEach(key => {
      if (typeof item[key] === 'number') {
        variables.add(key);
      }
    });
  });
  
  const result: string[] = [];
  variables.forEach(v => result.push(v));
  return result.sort();
}

