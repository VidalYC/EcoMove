export type LoanStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";

export interface Loan {
  id: string;
  userId: string;
  transportId: string;
  startDate: Date;
  endDate: Date | null;
  cost: number;
  status: LoanStatus;
}
