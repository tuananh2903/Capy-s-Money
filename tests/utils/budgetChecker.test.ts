import { evaluateJarBudget, BudgetAlertStatus } from '../../src/utils/budgetChecker';

describe('budgetChecker utility', () => {
  it('should return NORMAL if budgetLimit is 0', () => {
    const jar = { type: 'NEC', spentAmount: 1000, budgetLimit: 0 };
    const status = evaluateJarBudget(jar);
    expect(status).toBe(BudgetAlertStatus.NORMAL);
  });

  it('should return NORMAL if spent ratio is below 80%', () => {
    const jar = { type: 'NEC', spentAmount: 7900, budgetLimit: 10000 };
    const date = new Date(2026, 4, 10); // May 10, 2026
    const status = evaluateJarBudget(jar, date);
    expect(status).toBe(BudgetAlertStatus.NORMAL);
  });

  it('should return SPENDING_TOO_FAST if spent ratio is >= 80% and day is <= 15', () => {
    const jar = { type: 'NEC', spentAmount: 8000, budgetLimit: 10000 };
    const date1 = new Date(2026, 4, 1); // May 1, 2026
    const date2 = new Date(2026, 4, 15); // May 15, 2026
    
    expect(evaluateJarBudget(jar, date1)).toBe(BudgetAlertStatus.SPENDING_TOO_FAST);
    expect(evaluateJarBudget(jar, date2)).toBe(BudgetAlertStatus.SPENDING_TOO_FAST);
  });

  it('should return NORMAL if spent ratio is >= 80% but day is > 15 (e.g. day 16)', () => {
    const jar = { type: 'NEC', spentAmount: 8500, budgetLimit: 10000 };
    const date = new Date(2026, 4, 16); // May 16, 2026
    const status = evaluateJarBudget(jar, date);
    expect(status).toBe(BudgetAlertStatus.NORMAL);
  });

  it('should return OVER_BUDGET if spent ratio is >= 100% at any day', () => {
    const jar = { type: 'NEC', spentAmount: 10000, budgetLimit: 10000 };
    const date1 = new Date(2026, 4, 5); // Early month
    const date2 = new Date(2026, 4, 25); // Late month
    
    expect(evaluateJarBudget(jar, date1)).toBe(BudgetAlertStatus.OVER_BUDGET);
    expect(evaluateJarBudget(jar, date2)).toBe(BudgetAlertStatus.OVER_BUDGET);
  });
});
