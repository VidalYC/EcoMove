import { Loan } from "./loan.types";
import { canBeCancelled, canBeCompleted, canBeExtended } from "./loan.state";

export function completeLoan(loan: Loan, endDate: Date): Loan {
  if (!canBeCompleted(loan)) {
    throw new Error("Loan cannot be completed");
  }
  return { ...loan, endDate, status: "COMPLETED" };
}

export function cancelLoan(loan: Loan): Loan {
  if (!canBeCancelled(loan)) {
    throw new Error("Loan cannot be cancelled");
  }
  return { ...loan, status: "CANCELLED" };
}

export function extendLoan(loan: Loan, newEndDate: Date): Loan {
  if (!canBeExtended(loan)) {
    throw new Error("Loan cannot be extended");
  }
  return { ...loan, endDate: newEndDate };
}

export function updateLoanCost(loan: Loan, cost: number): Loan {
  return { ...loan, cost };
}
