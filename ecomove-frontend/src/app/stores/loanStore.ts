// 🗃️ LOAN STORE
import { create } from 'zustand';
import { Loan } from '../../core/entities/Loan';
import { ID, LoanStatus } from '../../shared/types';

export interface LoanState {
  activeLoan: Loan | null;
  loanHistory: Loan[];
  isCreating: boolean;
  isCompleting: boolean;
  isCancelling: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoanActions {
  setActiveLoan: (loan: Loan | null) => void;
  setLoanHistory: (loans: Loan[]) => void;
  setCreating: (creating: boolean) => void;
  setCompleting: (completing: boolean) => void;
  setCancelling: (cancelling: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addLoan: (loan: Loan) => void;
  updateLoan: (loanId: ID, updates: Partial<Loan>) => void;
  clearError: () => void;
  reset: () => void;
}

export type LoanStore = LoanState & LoanActions;

const initialState: LoanState = {
  activeLoan: null,
  loanHistory: [],
  isCreating: false,
  isCompleting: false,
  isCancelling: false,
  isLoading: false,
  error: null,
};

export const useLoanStore = create<LoanStore>()((set, get) => ({
  ...initialState,

  setActiveLoan: (activeLoan) => {
    set({ activeLoan });
  },

  setLoanHistory: (loanHistory) => {
    set({ loanHistory });
  },

  setCreating: (isCreating) => {
    set({ isCreating });
  },

  setCompleting: (isCompleting) => {
    set({ isCompleting });
  },

  setCancelling: (isCancelling) => {
    set({ isCancelling });
  },

  setLoading: (isLoading) => {
    set({ isLoading });
  },

  setError: (error) => {
    set({ error });
  },

  addLoan: (loan) => {
    const { loanHistory } = get();
    
    // Add to history
    set({ 
      loanHistory: [loan, ...loanHistory],
    });

    // Set as active loan if it's active
    if (loan.isActive()) {
      set({ activeLoan: loan });
    }
  },

  updateLoan: (loanId, updates) => {
    const { activeLoan, loanHistory } = get();

    // Update active loan if it matches
    if (activeLoan?.id === loanId) {
      const updatedLoan = { ...activeLoan, ...updates } as Loan;
      set({ 
        activeLoan: updatedLoan.isActive() ? updatedLoan : null,
      });
    }

    // Update in history
    const updatedHistory = loanHistory.map(loan =>
      loan.id === loanId ? { ...loan, ...updates } as Loan : loan
    );
    set({ loanHistory: updatedHistory });
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set({ ...initialState });
  },
}));

// Selectors
export const useActiveLoan = () => useLoanStore((state) => state.activeLoan);
export const useLoanHistory = () => useLoanStore((state) => state.loanHistory);
export const useLoanLoading = () => useLoanStore((state) => state.isLoading);
export const useLoanError = () => useLoanStore((state) => state.error);

// Computed selectors
export const useHasActiveLoan = () => {
  const activeLoan = useActiveLoan();
  return !!activeLoan;
};

export const useCompletedLoans = () => {
  const loanHistory = useLoanHistory();
  return loanHistory.filter(loan => loan.isCompleted());
};

export const useTotalLoansCount = () => {
  const loanHistory = useLoanHistory();
  return loanHistory.length;
};

export const useLoansByStatus = (status: LoanStatus) => {
  const loanHistory = useLoanHistory();
  return loanHistory.filter(loan => loan.status === status);
};