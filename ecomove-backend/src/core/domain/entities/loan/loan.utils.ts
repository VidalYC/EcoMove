export function calculateDurationInMinutes(
  startDate: Date,
  endDate: Date | null,
  isActive: boolean
): number | null {
  if (!endDate) {
    if (isActive) {
      const now = new Date();
      return Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60));
    }
    return null;
  }

  return Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60));
}

export function isOvertime(endDate: Date, limitMinutes: number): boolean {
  const now = new Date();
  const diff = (endDate.getTime() - now.getTime()) / (1000 * 60);
  return diff > limitMinutes;
}
