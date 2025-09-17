// 💎 COORDINATE VALUE OBJECT
import { calculateDistance } from '../../shared/utils';

export class Coordinate {
  constructor(
    private readonly latitude: number,
    private readonly longitude: number
  ) {
    if (!this.isValidLatitude(latitude)) {
      throw new Error('Invalid latitude: must be between -90 and 90');
    }
    if (!this.isValidLongitude(longitude)) {
      throw new Error('Invalid longitude: must be between -180 and 180');
    }
  }

  private isValidLatitude(lat: number): boolean {
    return lat >= -90 && lat <= 90;
  }

  private isValidLongitude(lng: number): boolean {
    return lng >= -180 && lng <= 180;
  }

  getLatitude(): number {
    return this.latitude;
  }

  getLongitude(): number {
    return this.longitude;
  }

  getLatLng(): [number, number] {
    return [this.latitude, this.longitude];
  }

  distanceTo(other: Coordinate): number {
    return calculateDistance(
      this.latitude,
      this.longitude,
      other.latitude,
      other.longitude
    );
  }

  isWithinRadius(center: Coordinate, radiusKm: number): boolean {
    return this.distanceTo(center) <= radiusKm;
  }

  equals(other: Coordinate): boolean {
    return (
      Math.abs(this.latitude - other.latitude) < 0.0001 &&
      Math.abs(this.longitude - other.longitude) < 0.0001
    );
  }

  toString(): string {
    return `${this.latitude},${this.longitude}`;
  }

  static create(latitude: number, longitude: number): Coordinate {
    return new Coordinate(latitude, longitude);
  }

  static fromLatLng(latLng: [number, number]): Coordinate {
    return new Coordinate(latLng[0], latLng[1]);
  }
}