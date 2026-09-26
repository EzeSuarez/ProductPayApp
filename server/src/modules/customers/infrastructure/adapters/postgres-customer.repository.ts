import { Injectable, Logger } from '@nestjs/common';
import { Customer } from '../../domain/customer.entity';
import { CustomerRepositoryPort } from '../../application/ports/customer.repository.port';
import { DatabaseService } from '../../../../database/database.service';

@Injectable()
export class PostgresCustomerRepository implements CustomerRepositoryPort {
  private readonly logger = new Logger(PostgresCustomerRepository.name);
  private readonly inMemoryStore = new Map<string, Customer>();

  constructor(private readonly db: DatabaseService) {}

  async save(customer: Customer): Promise<void> {
    try {
      const query = `
        INSERT INTO customers (id, full_name, email, phone_number, legal_id, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (id) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          email = EXCLUDED.email,
          phone_number = EXCLUDED.phone_number,
          legal_id = EXCLUDED.legal_id,
          updated_at = NOW();
      `;
      await this.db.query(query, [
        customer.id,
        customer.fullName,
        customer.email,
        customer.phoneNumber,
        customer.legalId || null,
      ]);
    } catch {
      this.logger.debug('Postgres unavailable, storing customer in-memory');
    }
    this.inMemoryStore.set(customer.id, customer);
  }

  async findById(id: string): Promise<Customer | null> {
    try {
      const res = await this.db.query(
        'SELECT id, full_name, email, phone_number, legal_id, created_at, updated_at FROM customers WHERE id = $1',
        [id]
      );
      if (res.rows.length > 0) {
        return this.mapRow(res.rows[0]);
      }
    } catch {
      this.logger.debug('Postgres unavailable, using in-memory store');
    }
    return this.inMemoryStore.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<Customer | null> {
    try {
      const res = await this.db.query(
        'SELECT id, full_name, email, phone_number, legal_id, created_at, updated_at FROM customers WHERE email = $1 LIMIT 1',
        [email]
      );
      if (res.rows.length > 0) {
        return this.mapRow(res.rows[0]);
      }
    } catch {
      this.logger.debug('Postgres unavailable, checking in-memory store');
    }
    for (const c of this.inMemoryStore.values()) {
      if (c.email.toLowerCase() === email.toLowerCase()) {
        return c;
      }
    }
    return null;
  }

  private mapRow(row: any): Customer {
    return new Customer({
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      phoneNumber: row.phone_number,
      legalId: row.legal_id || undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }
}
