export enum BudgetAlertStatus {
  NORMAL = 'NORMAL',
  SPENDING_TOO_FAST = 'SPENDING_TOO_FAST',
  OVER_BUDGET = 'OVER_BUDGET',
}

interface JarState {
  type: string;
  spentAmount: number;
  budgetLimit: number;
}

/**
 * Tính toán trạng thái cảnh báo ngân sách cho một hũ tài chính.
 * 
 * Quy tắc:
 * 1. Nếu hạn mức hũ <= 0 -> NORMAL.
 * 2. Nếu số tiền đã tiêu >= hạn mức -> OVER_BUDGET.
 * 3. Nếu số tiền đã tiêu >= 80% hạn mức và ngày trong tháng <= 15 -> SPENDING_TOO_FAST.
 * 4. Tất cả các trường hợp khác -> NORMAL.
 * 
 * @param jar Đối tượng chứa số tiền đã tiêu và hạn mức hũ
 * @param currentDate Ngày hiện tại kiểm tra (mặc định: new Date())
 */
export function evaluateJarBudget(jar: JarState, currentDate: Date = new Date()): BudgetAlertStatus {
  if (jar.budgetLimit <= 0) {
    return BudgetAlertStatus.NORMAL;
  }

  const spentRatio = jar.spentAmount / jar.budgetLimit;

  // 1. Kiểm tra trạng thái Vượt hạn mức (>= 100%)
  if (spentRatio >= 1.0) {
    return BudgetAlertStatus.OVER_BUDGET;
  }

  // 2. Kiểm tra trạng thái Tiêu dùng nhanh (>= 80% trước/vào ngày 15)
  const dayOfMonth = currentDate.getDate();
  if (spentRatio >= 0.8 && dayOfMonth <= 15) {
    return BudgetAlertStatus.SPENDING_TOO_FAST;
  }

  // 3. Bình thường
  return BudgetAlertStatus.NORMAL;
}
