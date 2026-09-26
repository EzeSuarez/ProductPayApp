import { BaseEntity } from '../../../common/domain/entity.base';
import { TransactionStatus } from './transaction-status.enum';

export interface TransactionProps {
  id: string;
  reference: string;
  productId: string;
  customerId?: string;
  deliveryId?: string;
  productAmountInCents: number;
  baseFeeInCents: number;
  deliveryFeeInCents: number;
  totalAmountInCents: number;
  currency?: string;
  status?: TransactionStatus;
  gatewayTransactionId?: string;
  cardBrand?: string;
  lastFour?: string;
  errorReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Transaction extends BaseEntity<string> {
  private _reference: string;
  private _productId: string;
  private _customerId?: string;
  private _deliveryId?: string;
  private _productAmountInCents: number;
  private _baseFeeInCents: number;
  private _deliveryFeeInCents: number;
  private _totalAmountInCents: number;
  private _currency: string;
  private _status: TransactionStatus;
  private _gatewayTransactionId?: string;
  private _cardBrand?: string;
  private _lastFour?: string;
  private _errorReason?: string;

  constructor(props: TransactionProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this._reference = props.reference;
    this._productId = props.productId;
    this._customerId = props.customerId;
    this._deliveryId = props.deliveryId;
    this._productAmountInCents = props.productAmountInCents;
    this._baseFeeInCents = props.baseFeeInCents;
    this._deliveryFeeInCents = props.deliveryFeeInCents;
    this._totalAmountInCents = props.totalAmountInCents;
    this._currency = props.currency ?? 'COP';
    this._status = props.status ?? 'PENDING';
    this._gatewayTransactionId = props.gatewayTransactionId;
    this._cardBrand = props.cardBrand;
    this._lastFour = props.lastFour;
    this._errorReason = props.errorReason;
  }

  get reference(): string {
    return this._reference;
  }

  get productId(): string {
    return this._productId;
  }

  get customerId(): string | undefined {
    return this._customerId;
  }

  get deliveryId(): string | undefined {
    return this._deliveryId;
  }

  get productAmountInCents(): number {
    return this._productAmountInCents;
  }

  get baseFeeInCents(): number {
    return this._baseFeeInCents;
  }

  get deliveryFeeInCents(): number {
    return this._deliveryFeeInCents;
  }

  get totalAmountInCents(): number {
    return this._totalAmountInCents;
  }

  get currency(): string {
    return this._currency;
  }

  get status(): TransactionStatus {
    return this._status;
  }

  get gatewayTransactionId(): string | undefined {
    return this._gatewayTransactionId;
  }

  get cardBrand(): string | undefined {
    return this._cardBrand;
  }

  get lastFour(): string | undefined {
    return this._lastFour;
  }

  get errorReason(): string | undefined {
    return this._errorReason;
  }

  markApproved(gatewayTransactionId: string, customerId: string, deliveryId: string): void {
    this._status = 'APPROVED';
    this._gatewayTransactionId = gatewayTransactionId;
    this._customerId = customerId;
    this._deliveryId = deliveryId;
    this._updatedAt = new Date();
  }

  markDeclined(reason?: string): void {
    this._status = 'DECLINED';
    this._errorReason = reason || 'Payment declined by financial institution';
    this._updatedAt = new Date();
  }

  markError(reason: string): void {
    this._status = 'ERROR';
    this._errorReason = reason;
    this._updatedAt = new Date();
  }

  toJSON() {
    return {
      id: this.id,
      reference: this._reference,
      productId: this._productId,
      customerId: this._customerId,
      deliveryId: this._deliveryId,
      productAmountInCents: this._productAmountInCents,
      baseFeeInCents: this._baseFeeInCents,
      deliveryFeeInCents: this._deliveryFeeInCents,
      totalAmountInCents: this._totalAmountInCents,
      currency: this._currency,
      status: this._status,
      gatewayTransactionId: this._gatewayTransactionId,
      cardBrand: this._cardBrand,
      lastFour: this._lastFour,
      errorReason: this._errorReason,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
