import { Injectable, Logger } from '@nestjs/common';
import { Delivery } from '../../domain/delivery.entity';
import { DeliveryRepositoryPort } from '../../application/ports/delivery.repository.port';
import { DatabaseService } from '../../../../database/database.service';

@Injectable()
export class PostgresDeliveryRepository implements DeliveryRepositoryPort {
  private readonly logger = new Logger(PostgresDeliveryRepository.name);
  private readonly inMemoryStore = new Map<string, Delivery>();

  constructor(private readonly db: DatabaseService) {}

  async save(delivery: Delivery): Promise<void> {
    try {
      const query = `
        INSERT INTO deliveries (id, customer_id, address_line1, address_line2, city, region, postal_code, status, tracking_number, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        ON CONFLICT (id) DO UPDATE SET
          address_line1 = EXCLUDED.address_line1,
          address_line2 = EXCLUDED.address_line2,
          city = EXCLUDED.city,
          region = EXCLUDED.region,
          postal_code = EXCLUDED.postal_code,
          status = EXCLUDED.status,
          tracking_number = EXCLUDED.tracking_number,
          updated_at = NOW();
      `;
      await this.db.query(query, [
        delivery.id,
        delivery.customerId,
        delivery.addressLine1,
        delivery.addressLine2 || null,
        delivery.city,
        delivery.region,
        delivery.postalCode || null,
        delivery.status,
        delivery.trackingNumber || null,
      ]);
    } catch {
      this.logger.debug('Postgres unavailable, saving delivery in-memory');
    }
    this.inMemoryStore.set(delivery.id, delivery);
  }

  async findById(id: string): Promise<Delivery | null> {
    try {
      const res = await this.db.query(
        'SELECT id, customer_id, address_line1, address_line2, city, region, postal_code, status, tracking_number, created_at, updated_at FROM deliveries WHERE id = $1',
        [id]
      );
      if (res.rows.length > 0) {
        return this.mapRow(res.rows[0]);
      }
    } catch {
      this.logger.debug('Postgres unavailable, querying in-memory store');
    }
    return this.inMemoryStore.get(id) ?? null;
  }

  async findByCustomerId(customerId: string): Promise<Delivery[]> {
    try {
      const res = await this.db.query(
        'SELECT id, customer_id, address_line1, address_line2, city, region, postal_code, status, tracking_number, created_at, updated_at FROM deliveries WHERE customer_id = $1',
        [customerId]
      );
      if (res.rows.length > 0) {
        return res.rows.map((r) => this.mapRow(r));
      }
    } catch {
      this.logger.debug('Postgres unavailable, querying in-memory store');
    }
    const results: Delivery[] = [];
    for (const d of this.inMemoryStore.values()) {
      if (d.customerId === customerId) {
        results.push(d);
      }
    }
    return results;
  }

  private mapRow(row: any): Delivery {
    return new Delivery({
      id: row.id,
      customerId: row.customer_id,
      addressLine1: row.address_line1,
      addressLine2: row.address_line2 || undefined,
      city: row.city,
      region: row.region,
      postalCode: row.postal_code || undefined,
      status: row.status,
      trackingNumber: row.tracking_number || undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }
}
