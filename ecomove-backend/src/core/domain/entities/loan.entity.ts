import { LoanStatus } from '../../../shared/enums/loan.enums';
import { PaymentMethod } from '../../../shared/enums/payment.enums';

export class Loan {
  constructor(
    private id: number | null,
    private userId: number,
    private transportId: number,
    private originStationId: number,
    private destinationStationId: number | null,
    private startDate: Date,
    private endDate: Date | null,
    private estimatedDuration: number | null, // en minutos
    private totalCost: number | null,
    private status: LoanStatus,
    private paymentMethod: PaymentMethod | null,
    private createdAt: Date = new Date(),
    private updatedAt: Date = new Date()
  ) {}

  // ========== FACTORY METHODS ==========
  static create(
    userId: number,
    transportId: number,
    originStationId: number,
    estimatedDuration?: number
  ): Loan {
    if (userId <= 0) {
      throw new Error('ID de usuario inválido');
    }
    if (transportId <= 0) {
      throw new Error('ID de transporte inválido');
    }
    if (originStationId <= 0) {
      throw new Error('ID de estación de origen inválido');
    }
    if (estimatedDuration !== undefined && estimatedDuration <= 0) {
      throw new Error('Duración estimada debe ser mayor a 0');
    }

    return new Loan(
      null,
      userId,
      transportId,
      originStationId,
      null,
      new Date(),
      null,
      estimatedDuration || null,
      null,
      LoanStatus.ACTIVE,
      null,
      new Date(),
      new Date()
    );
  }

  static fromPersistence(data: any): Loan {
    return new Loan(
      data.id,
      data.usuario_id,
      data.transporte_id,
      data.estacion_origen_id,
      data.estacion_destino_id,
      new Date(data.fecha_inicio),
      data.fecha_fin ? new Date(data.fecha_fin) : null,
      data.duracion_estimada,
      data.costo_total,
      data.estado as LoanStatus,
      data.metodo_pago as PaymentMethod,
      new Date(data.created_at),
      new Date(data.updated_at)
    );
  }

  // ========== GETTERS ==========
  getId(): number | null {
    return this.id;
  }

  getUserId(): number {
    return this.userId;
  }

  getTransportId(): number {
    return this.transportId;
  }

  getOriginStationId(): number {
    return this.originStationId;
  }

  getDestinationStationId(): number | null {
    return this.destinationStationId;
  }

  getStartDate(): Date {
    return this.startDate;
  }

  getEndDate(): Date | null {
    return this.endDate;
  }

  getEstimatedDuration(): number | null {
    return this.estimatedDuration;
  }

  getTotalCost(): number | null {
    return this.totalCost;
  }

  getStatus(): LoanStatus {
    return this.status;
  }

  getPaymentMethod(): PaymentMethod | null {
    return this.paymentMethod;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  // ========== MÉTODOS DE NEGOCIO ==========
  complete(destinationStationId: number, totalCost: number, paymentMethod: PaymentMethod): void {
    if (!this.canBeCompleted()) {
      throw new Error('El préstamo no puede ser completado en su estado actual');
    }
    if (destinationStationId <= 0) {
      throw new Error('ID de estación de destino inválido');
    }
    if (totalCost < 0) {
      throw new Error('El costo total no puede ser negativo');
    }

    this.destinationStationId = destinationStationId;
    this.endDate = new Date();
    this.totalCost = totalCost;
    this.paymentMethod = paymentMethod;
    this.status = LoanStatus.COMPLETED;
    this.markAsUpdated();
  }

  cancel(): void {
    if (!this.canBeCancelled()) {
      throw new Error('El préstamo no puede ser cancelado en su estado actual');
    }

    this.endDate = new Date();
    this.status = LoanStatus.CANCELLED;
    this.markAsUpdated();
  }

  extend(additionalMinutes: number, additionalCost: number): void {
    if (!this.canBeExtended()) {
      throw new Error('El préstamo no puede ser extendido en su estado actual');
    }
    if (additionalMinutes <= 0) {
      throw new Error('Los minutos adicionales deben ser mayor a 0');
    }
    if (additionalCost < 0) {
      throw new Error('El costo adicional no puede ser negativo');
    }

    this.estimatedDuration = (this.estimatedDuration || 0) + additionalMinutes;
    this.totalCost = (this.totalCost || 0) + additionalCost;
    this.status = LoanStatus.EXTENDED;
    this.markAsUpdated();
  }

  updateCost(newCost: number): void {
    if (newCost < 0) {
      throw new Error('El costo no puede ser negativo');
    }
    this.totalCost = newCost;
    this.markAsUpdated();
  }

  // ========== VALIDACIONES DE ESTADO ==========
  isActive(): boolean {
    return this.status === LoanStatus.ACTIVE || this.status === LoanStatus.EXTENDED;
  }

  isCompleted(): boolean {
    return this.status === LoanStatus.COMPLETED;
  }

  isCancelled(): boolean {
    return this.status === LoanStatus.CANCELLED;
  }

  canBeCompleted(): boolean {
    return this.status === LoanStatus.ACTIVE || this.status === LoanStatus.EXTENDED;
  }

  canBeCancelled(): boolean {
    return this.status === LoanStatus.ACTIVE || this.status === LoanStatus.EXTENDED;
  }

  canBeExtended(): boolean {
    return this.status === LoanStatus.ACTIVE;
  }

  // ========== CÁLCULOS ==========
  getDurationInMinutes(): number | null {
    if (!this.endDate) {
      // Si está activo, calcular duración hasta ahora
      if (this.isActive()) {
        const now = new Date();
        return Math.floor((now.getTime() - this.startDate.getTime()) / (1000 * 60));
      }
      return null;
    }
    return Math.floor((this.endDate.getTime() - this.startDate.getTime()) / (1000 * 60));
  }

  isOvertime(): boolean {
    const currentDuration = this.getDurationInMinutes();
    if (!currentDuration || !this.estimatedDuration) {
      return false;
    }
    return currentDuration > this.estimatedDuration;
  }

  // ========== UTILIDADES ==========
  private markAsUpdated(): void {
    this.updatedAt = new Date();
  }

  toPersistence(): any {
    return {
      id: this.id,
      usuario_id: this.userId,
      transporte_id: this.transportId,
      estacion_origen_id: this.originStationId,
      estacion_destino_id: this.destinationStationId,
      fecha_inicio: this.startDate,
      fecha_fin: this.endDate,
      duracion_estimada: this.estimatedDuration,
      costo_total: this.totalCost,
      estado: this.status,
      metodo_pago: this.paymentMethod,
      created_at: this.createdAt,
      updated_at: this.updatedAt
    };
  }

  // Para debugging
  toString(): string {
    return `Loan[id=${this.id}, userId=${this.userId}, transportId=${this.transportId}, status=${this.status}]`;
  }
}