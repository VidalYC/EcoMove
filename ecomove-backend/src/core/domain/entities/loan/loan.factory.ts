import { Loan } from "./loan.types";

export function createLoan(params: {
  id: string;
  userId: string;
  transportId: string;
  startDate: Date;
}): Loan {
  return {
    ...params,
    status: "ACTIVE",
    endDate: null,
    cost: 0,
  };
}

export function loanFromPersistence(raw: any): Loan {
  return {
    id: raw.id,
    userId: raw.userId,
    transportId: raw.transportId,
    startDate: new Date(raw.start_date),
    endDate: raw.end_date ? new Date(raw.end_date) : null,
    cost: raw.cost,
    status: raw.status,
  };
}
