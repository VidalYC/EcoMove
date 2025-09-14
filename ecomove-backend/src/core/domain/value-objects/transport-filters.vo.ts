export class TransportFilters {
  constructor(
    public readonly type?: TransportType,
    public readonly status?: TransportStatus,
    public readonly stationId?: number,
    public readonly minRate?: number,
    public readonly maxRate?: number
  ) {}

  static create(data: {
    type?: string;
    status?: string;
    stationId?: number;
    minRate?: number;
    maxRate?: number;
  }): TransportFilters {
    return new TransportFilters(
      data.type as TransportType,
      data.status as TransportStatus,
      data.stationId,
      data.minRate,
      data.maxRate
    );
  }

  hasFilters(): boolean {
    return !!(this.type || this.status || this.stationId || this.minRate || this.maxRate);
  }
}