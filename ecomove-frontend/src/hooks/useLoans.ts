import { useState, useEffect } from 'react';
import { apiService, Loan, CreateLoanRequest, CompleteLoanRequest } from '../services/api.service';

interface UseLoansReturn {
  loans: Loan[];
  loading: boolean;
  error: string | null;
  refreshLoans: () => Promise<void>;
  createLoan: (data: CreateLoanRequest) => Promise<Loan | null>;
  completeLoan: (loanId: string, data: CompleteLoanRequest) => Promise<Loan | null>;
  cancelLoan: (loanId: string) => Promise<Loan | null>;
  extendLoan: (loanId: string, newDurationMinutes: number) => Promise<Loan | null>;
  calculateFare: (vehicleType: string, durationMinutes: number) => Promise<{ fare: number; breakdown: any } | null>;
  getActiveLoan: () => Loan | null;
}

export function useLoans(): UseLoansReturn {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshLoans = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.getLoans();
      
      if (response.success && response.data) {
        setLoans(response.data);
      } else {
        setError(response.message || 'Failed to load loans');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to load loans');
    } finally {
      setLoading(false);
    }
  };

  const createLoan = async (data: CreateLoanRequest): Promise<Loan | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.createLoan(data);
      
      if (response.success && response.data) {
        setLoans(prev => [...prev, response.data as Loan]);
        return response.data;
      } else {
        setError(response.message || 'Failed to create loan');
        return null;
      }
    } catch (error: any) {
      setError(error.message || 'Failed to create loan');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const completeLoan = async (loanId: string, data: CompleteLoanRequest): Promise<Loan | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.completeLoan(loanId, data);
      
      if (response.success && response.data) {
        setLoans(prev => 
          prev.map(loan => 
            loan.id === loanId ? response.data! : loan
          )
        );
        return response.data;
      } else {
        setError(response.message || 'Failed to complete loan');
        return null;
      }
    } catch (error: any) {
      setError(error.message || 'Failed to complete loan');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const cancelLoan = async (loanId: string): Promise<Loan | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.cancelLoan(loanId);
      
      if (response.success && response.data) {
        setLoans(prev => 
          prev.map(loan => 
            loan.id === loanId ? response.data! : loan
          )
        );
        return response.data;
      } else {
        setError(response.message || 'Failed to cancel loan');
        return null;
      }
    } catch (error: any) {
      setError(error.message || 'Failed to cancel loan');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const extendLoan = async (loanId: string, newDurationMinutes: number): Promise<Loan | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.extendLoan(loanId, { newDurationMinutes });
      
      if (response.success && response.data) {
        setLoans(prev => 
          prev.map(loan => 
            loan.id === loanId ? response.data! : loan
          )
        );
        return response.data;
      } else {
        setError(response.message || 'Failed to extend loan');
        return null;
      }
    } catch (error: any) {
      setError(error.message || 'Failed to extend loan');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const calculateFare = async (vehicleType: string, durationMinutes: number): Promise<{ fare: number; breakdown: any } | null> => {
    try {
      const response = await apiService.calculateFare({ vehicleType, durationMinutes });
      
      if (response.success && response.data) {
        return response.data;
      } else {
        setError(response.message || 'Failed to calculate fare');
        return null;
      }
    } catch (error: any) {
      setError(error.message || 'Failed to calculate fare');
      return null;
    }
  };

  const getActiveLoan = (): Loan | null => {
    return loans.find(loan => loan.status === 'active') || null;
  };

  useEffect(() => {
    refreshLoans();
  }, []);

  return {
    loans,
    loading,
    error,
    refreshLoans,
    createLoan,
    completeLoan,
    cancelLoan,
    extendLoan,
    calculateFare,
    getActiveLoan,
  };
}