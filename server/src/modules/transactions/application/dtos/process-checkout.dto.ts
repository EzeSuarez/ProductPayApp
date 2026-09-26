import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsUUID,
  IsOptional,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CustomerInfoDto {
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber!: string;

  @IsOptional()
  @IsString()
  legalId?: string;
}

export class DeliveryInfoDto {
  @IsString()
  @IsNotEmpty()
  addressLine1!: string;

  @IsOptional()
  @IsString()
  addressLine2?: string;

  @IsString()
  @IsNotEmpty()
  city!: string;

  @IsString()
  @IsNotEmpty()
  region!: string;

  @IsOptional()
  @IsString()
  postalCode?: string;
}

export class PaymentInfoDto {
  @IsString()
  @IsNotEmpty()
  cardToken!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  installments?: number = 1;

  @IsString()
  @IsNotEmpty()
  acceptanceToken!: string;

  @IsString()
  @IsNotEmpty()
  acceptPersonalAuth!: string;

  @IsOptional()
  @IsString()
  cardBrand?: string;

  @IsOptional()
  @IsString()
  lastFour?: string;
}

export class ProcessCheckoutDto {
  @IsUUID()
  productId!: string;

  @ValidateNested()
  @Type(() => CustomerInfoDto)
  customer!: CustomerInfoDto;

  @ValidateNested()
  @Type(() => DeliveryInfoDto)
  delivery!: DeliveryInfoDto;

  @ValidateNested()
  @Type(() => PaymentInfoDto)
  payment!: PaymentInfoDto;
}

export interface CheckoutResultDto {
  transactionId: string;
  reference: string;
  status: string;
  productId: string;
  totalAmountInCents: number;
  currency: string;
  gatewayTransactionId?: string;
  errorReason?: string;
  customerId?: string;
  deliveryId?: string;
}
