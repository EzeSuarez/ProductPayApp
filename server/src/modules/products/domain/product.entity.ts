import { BaseEntity } from '../../../common/domain/entity.base';
import { Result } from '../../../common/domain/result';
import { InsufficientStockError } from './errors/insufficient-stock.error';

export interface ProductProps {
  id: string;
  name: string;
  description: string;
  priceInCents: number;
  stock: number;
  imageUrl: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Product extends BaseEntity<string> {
  private _name: string;
  private _description: string;
  private _priceInCents: number;
  private _stock: number;
  private _imageUrl: string;

  constructor(props: ProductProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this._name = props.name;
    this._description = props.description;
    this._priceInCents = props.priceInCents;
    this._stock = props.stock;
    this._imageUrl = props.imageUrl;
  }

  get name(): string {
    return this._name;
  }

  get description(): string {
    return this._description;
  }

  get priceInCents(): number {
    return this._priceInCents;
  }

  get stock(): number {
    return this._stock;
  }

  get imageUrl(): string {
    return this._imageUrl;
  }

  hasStockFor(quantity: number): boolean {
    return this._stock >= quantity && quantity > 0;
  }

  reserveStock(quantity: number): Result<void, InsufficientStockError> {
    if (!this.hasStockFor(quantity)) {
      return Result.fail(new InsufficientStockError(this.id, quantity, this._stock));
    }
    this._stock -= quantity;
    this._updatedAt = new Date();
    return Result.ok(undefined);
  }

  releaseStock(quantity: number): void {
    this._stock += quantity;
    this._updatedAt = new Date();
  }

  toJSON() {
    return {
      id: this.id,
      name: this._name,
      description: this._description,
      priceInCents: this._priceInCents,
      stock: this._stock,
      imageUrl: this._imageUrl,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
