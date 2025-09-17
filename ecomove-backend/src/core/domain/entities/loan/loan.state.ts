import { Loan } from "./loan.types";

export function canBeCompleted(loan: Loan): boolean {
  return loan.status === "ACTIVE";
}

export function canBeCancelled(loan: Loan): boolean {
  return loan.status === "ACTIVE";
}

export function canBeExtended(loan: Loan): boolean {
  return loan.status === "ACTIVE";
}

export function isActive(loan: Loan): boolean {
  return loan.status === "ACTIVE";
}

export function isCompleted(loan: Loan): boolean {
  return loan.status === "COMPLETED";
}

export function isCancelled(loan: Loan): boolean {
  return loan.status === "CANCELLED";
}
