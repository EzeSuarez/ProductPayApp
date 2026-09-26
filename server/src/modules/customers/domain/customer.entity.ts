import { BaseEntity } from '../../../common/domain/entity.base';

export interface CustomerProps {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  legalId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Customer extends BaseEntity<string> {
  private _fullName: string;
  private _email: string;
  private _phoneNumber: string;
  private _legalId?: string;

  constructor(props: CustomerProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this._fullName = props.fullName;
    this._email = props.email;
    this._phoneNumber = props.phoneNumber;
    this._legalId = props.legalId;
  }

  get fullName(): string {
    return this._fullName;
  }

  get email(): string {
    return this._email;
  }

  get phoneNumber(): string {
    return this._phoneNumber;
  }

  get legalId(): string | undefined {
    return this._legalId;
  }

  toJSON() {
    return {
      id: this.id,
      fullName: this._fullName,
      email: this._email,
      phoneNumber: this._phoneNumber,
      legalId: this._legalId,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
