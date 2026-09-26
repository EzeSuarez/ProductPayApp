import { Injectable, Logger } from '@nestjs/common';
import { Transaction } from '../../domain/transaction.entity';
import { TransactionRepositoryPort } from '../../application/ports/transaction.repository.port';
import { DatabaseService } from '../../../../database/database.service';

@Injectable()
export class PostgresTransactionRepository implements TransactionRepositoryPort {
  private readonly logger = new Logger(PostgresTransactionRepository.name);
  private readonly inMemoryStore = new Map<string, Transaction>();

  constructor(private readonly db: DatabaseService) {}

  async save(transaction: Transaction): Promise<void> {
    try {
      const query = `
        INSERT INTO transactions (
          id, reference, product_id, customer_id, delivery_id,
          product_amount_in_cents, base_fee_in_cents, delivery_fee_in_cents, total_amount_in_cents,
          currency, status, gateway_transaction_id, card_brand, last_four, error_reason, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
        ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status,
          gateway_transaction_id = EXCLUDED.gateway_transaction_id,
          customer_id = EXCLUDED.customer_id,
          delivery_id = EXCLUDED.delivery_id,
          error_reason = EXCLUDED.error_reason,
          updated_at = NOW();
      `;
      await this.db.query(query, [
        transaction.id,
        transaction.reference,
        transaction.productId,
        transaction.customerId || null,
        transaction.deliveryId || null,
        transaction.productAmountInCents,
        transaction.baseFeeInCents,
        transaction.deliveryFeeInCents,
        transaction.totalAmountInCents,
        transaction.currency,
        transaction.status,
        transaction.gatewayTransactionId || null,
        transaction.cardBrand || null,
        transaction.lastFour || null,
        transaction.errorReason || null,
      ]);
    } catch {
      this.logger.debug('Postgres unavailable, storing transaction in-memory');
    }
    this.inMemoryStore.set(transaction.id, transaction);
  }

  async findById(id: string): Promise<Transaction | null> {
    try {
      const res = await this.db.query(
        `SELECT id, reference, product_id, customer_id, delivery_id,
                product_amount_in_cents, base_fee_in_cents, delivery_fee_in_cents, total_amount_in_cents,
                currency, status, gateway_transaction_id, card_brand, last_four, error_reason,
                created_at, updated_at
         FROM transactions WHERE id = $1`,
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

  async findByReference(reference: string): Promise<Transaction | null> {
    try {
      const res = await this.db.query(
        `SELECT id, reference, product_id, customer_id, delivery_id,
                product_amount_in_cents, base_fee_in_cents, delivery_fee_in_cents, total_amount_in_cents,
                currency, status, gateway_transaction_id, card_brand, last_four, error_reason,
                created_at, updated_at
         FROM transactions WHERE reference = $1 LIMIT 1`,
        [reference]
      );
      if (res.rows.length > 0) {
        return this.mapRow(res.rows[0]);
      }
    } catch {
      this.logger.debug('Postgres unavailable, checking in-memory store');
    }
    for (const tx of this.inMemoryStore.values()) {
      if (tx.reference === reference) {
        return tx;
      }
    }
    return null;
  }

  private mapRow(row: any): Transaction {
    return new Transaction({
      id: row.id,
      reference: row.reference,
      productId: row.product_id,
      customerId: row.customer_id || undefined,
      deliveryId: row.delivery_id || undefined,
      productAmountInCents: Number(row.product_amount_in_cents),
      baseFeeInCents: Number(row.base_fee_in_cents),
      deliveryFeeInCents: Number(row.delivery_fee_in_cents),
      totalAmountInCents: Number(row.total_amount_in_cents),
      currency: row.currency,
      status: row.status,
      gatewayTransactionId: row.gateway_transaction_id || undefined,
      cardBrand: row.card_brand || undefined,
      lastFour: row.last_four || undefined,
      errorReason: row.error_reason || undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }
}
