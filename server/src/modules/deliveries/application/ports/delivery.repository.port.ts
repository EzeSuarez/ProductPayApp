import { Delivery } from '../../domain/delivery.entity';

export const DELIVERY_REPOSITORY_PORT = Symbol('DELIVERY_REPOSITORY_PORT');

export interface DeliveryRepositoryPort {
  save(delivery: Delivery): Promise<void>;
  findById(id: string): Promise<Delivery | null>;
  findByCustomerId(customerId: string): Promise<Delivery[]>;
}
