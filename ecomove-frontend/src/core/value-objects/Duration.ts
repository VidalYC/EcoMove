// 💎 DURATION VALUE OBJECT
import { formatDuration } from '../../shared/utils';

export class Duration {
  constructor(private readonly minutes: number) {
    if (minutes < 0) {
      throw new Error('Duration cannot be negative');
    }
  }

  getMinutes(): number {
    return this.minutes;
  }

  getHours(): number {
    return this.minutes / 60;
  }

  getDays(): number {
    return this.minutes / (60 * 24);
  }

  add(other: Duration): Duration {
    return new Duration(this.minutes + other.minutes);
  }

  subtract(other: Duration): Duration {
    const result = this.minutes - other.minutes;
    if (result < 0) {
      throw new Error('Result duration cannot be negative');
    }
    return new Duration(result);
  }

  multiply(factor: number): Duration {
    if (factor < 0) {
      throw new Error('Factor cannot be negative');
    }
    return new Duration(this.minutes * factor);
  }

  isGreaterThan(other: Duration): boolean {
    return this.minutes > other.minutes;
  }

  isLessThan(other: Duration): boolean {
    return this.minutes < other.minutes;
  }

  equals(other: Duration): boolean {
    return this.minutes === other.minutes;
  }

  format(): string {
    return formatDuration(this.minutes);
  }

  toString(): string {
    return this.format();
  }

  static create(minutes: number): Duration {
    return new Duration(minutes);
  }

  static fromHours(hours: number): Duration {
    return new Duration(hours * 60);
  }

  static fromDays(days: number): Duration {
    return new Duration(days * 24 * 60);
  }

  static between(start: Date, end: Date): Duration {
    const diffMs = end.getTime() - start.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return new Duration(Math.max(0, diffMinutes));
  }
}