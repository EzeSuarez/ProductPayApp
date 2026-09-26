import { BaseEntity } from '../../../common/domain/entity.base';

export type DeliveryStatus = 'PENDING' | 'ASSIGNED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface DeliveryProps {
  id: string;
  customerId: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  region: string;
  postalCode?: string;
  status?: DeliveryStatus;
  trackingNumber?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Delivery extends BaseEntity<string> {
  private _customerId: string;
  private _addressLine1: string;
  private _addressLine2?: string;
  private _city: string;
  private _region: string;
  private _postalCode?: string;
  private _status: DeliveryStatus;
  private _trackingNumber?: string;

  constructor(props: DeliveryProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this._customerId = props.customerId;
    this._addressLine1 = props.addressLine1;
    this._addressLine2 = props.addressLine2;
    this._city = props.city;
    this._region = props.region;
    this._postalCode = props.postalCode;
    this._status = props.status ?? 'PENDING';
    this._trackingNumber = props.trackingNumber;
  }

  get customerId(): string {
    return this._customerId;
  }

  get addressLine1(): string {
    return this._addressLine1;
  }

  get addressLine2(): string | undefined {
    return this._addressLine2;
  }

  get city(): string {
    return this._city;
  }

  get region(): string {
    return this._region;
  }

  get postalCode(): string | undefined {
    return this._postalCode;
  }

  get status(): DeliveryStatus {
    return this._status;
  }

  get trackingNumber(): string | undefined {
    return this._trackingNumber;
  }

  assignTracking(trackingNumber: string): void {
    this._status = 'ASSIGNED';
    this._trackingNumber = trackingNumber;
    this._updatedAt = new Date();
  }

  toJSON() {
    return {
      id: this.id,
      customerId: this._customerId,
      addressLine1: this._addressLine1,
      addressLine2: this._addressLine2,
      city: this._city,
      region: this._region,
      postalCode: this._postalCode,
      status: this._status,
      trackingNumber: this._trackingNumber,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
