import { Injectable, Logger } from '@nestjs/common';
import { Product } from '../../domain/product.entity';
import { ProductRepositoryPort } from '../../application/ports/product.repository.port';
import { DatabaseService } from '../../../../database/database.service';

const INITIAL_SEED_PRODUCTS = [
  {
    id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    name: 'Sony WH-1000XM5 Wireless Headphones (Midnight Black)',
    description: 'Industry-leading noise canceling with Auto NC Optimizer, crystal clear hands-free calling, and 30-hour battery life.',
    priceInCents: 145000000,
    stock: 12,
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
  },
  {
    id: 'b2c3d4e5-f6a7-4b6c-9d0e-1f2a3b4c5d6e',
    name: 'Apple Watch Series 9 GPS 45mm (Space Black)',
    description: 'Smarter, brighter, and mightier. Double tap gesture, S9 SiP chip, and advanced health sensors.',
    priceInCents: 215000000,
    stock: 8,
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
  },
  {
    id: 'c3d4e5f6-a7b8-4c7d-8e1f-2a3b4c5d6e7f',
    name: 'Minimalist Leather Travel Backpack (Matte Black)',
    description: 'Water-resistant full-grain leather, padded 16-inch laptop compartment, and ergonomic shoulder straps.',
    priceInCents: 38000000,
    stock: 25,
    imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
  },
  {
    id: 'd4e5f6a7-b8c9-4d0e-8f2a-3b4c5d6e7f8a',
    name: 'Keychron K2 Pro Mechanical Keyboard',
    description: 'Wireless QMK/VIA custom mechanical keyboard, RGB backlighting, hot-swappable switches, sound-absorbing foam.',
    priceInCents: 52000000,
    stock: 15,
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80',
  },
  {
    id: 'e5f6a7b8-c9d0-4e1f-8a3b-4c5d6e7f8a9b',
    name: 'Fujifilm X100V Digital Camera (Silver & Black)',
    description: '26.1MP APS-C X-Trans BSI CMOS sensor, fixed 23mm f/2 lens, hybrid optical/electronic viewfinder, 4K video.',
    priceInCents: 689000000,
    stock: 4,
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80',
  },
  {
    id: 'f6a7b8c9-d0e1-4f2a-8b4c-5d6e7f8a9b0c',
    name: 'Hario V60 Ceramic Drip Set (Monochrome Edition)',
    description: 'Classic pour-over brewer with heatproof glass server, measurement scale, and ergonomic kettle spout.',
    priceInCents: 19500000,
    stock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&q=80',
  },
];

@Injectable()
export class PostgresProductRepository implements ProductRepositoryPort {
  private readonly logger = new Logger(PostgresProductRepository.name);
  private readonly inMemoryStore = new Map<string, Product>();

  constructor(private readonly db: DatabaseService) {
    // Pre-populate in-memory store for fallback/dev
    for (const item of INITIAL_SEED_PRODUCTS) {
      this.inMemoryStore.set(item.id, new Product(item));
    }
  }

  async findAll(): Promise<Product[]> {
    try {
      const res = await this.db.query(
        'SELECT id, name, description, price_in_cents, stock, image_url, created_at, updated_at FROM products ORDER BY created_at ASC'
      );
      if (res.rows.length > 0) {
        return res.rows.map((r) => this.mapRowToEntity(r));
      }
    } catch {
      this.logger.debug('PostgreSQL query unavailable, using in-memory store fallback');
    }
    return Array.from(this.inMemoryStore.values());
  }

  async findById(id: string): Promise<Product | null> {
    try {
      const res = await this.db.query(
        'SELECT id, name, description, price_in_cents, stock, image_url, created_at, updated_at FROM products WHERE id = $1',
        [id]
      );
      if (res.rows.length > 0) {
        return this.mapRowToEntity(res.rows[0]);
      }
    } catch {
      this.logger.debug('PostgreSQL query unavailable, using in-memory store fallback');
    }
    return this.inMemoryStore.get(id) ?? null;
  }

  async decrementStockAtomic(productId: string, quantity: number): Promise<boolean> {
    try {
      const query = `
        UPDATE products
        SET stock = stock - $1, updated_at = NOW()
        WHERE id = $2 AND stock >= $1
        RETURNING id, stock;
      `;
      const res = await this.db.query(query, [quantity, productId]);
      if (res.rowCount && res.rowCount > 0) {
        return true;
      }
    } catch (err) {
      this.logger.error(`PostgreSQL query failed in decrementStockAtomic: ${err.message}`);
      this.logger.debug('PostgreSQL query unavailable, performing atomic in-memory decrement');
    }

    const product = this.inMemoryStore.get(productId);
    if (!product || product.stock < quantity) {
      return false;
    }
    product.reserveStock(quantity);
    return true;
  }

  async incrementStock(productId: string, quantity: number): Promise<void> {
    try {
      const query = `
        UPDATE products
        SET stock = stock + $1, updated_at = NOW()
        WHERE id = $2;
      `;
      await this.db.query(query, [quantity, productId]);
    } catch {
      this.logger.debug('PostgreSQL query unavailable, performing in-memory stock increment');
    }

    const product = this.inMemoryStore.get(productId);
    if (product) {
      product.releaseStock(quantity);
    }
  }

  async save(product: Product): Promise<void> {
    try {
      const query = `
        INSERT INTO products (id, name, description, price_in_cents, stock, image_url, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          price_in_cents = EXCLUDED.price_in_cents,
          stock = EXCLUDED.stock,
          image_url = EXCLUDED.image_url,
          updated_at = NOW();
      `;
      await this.db.query(query, [
        product.id,
        product.name,
        product.description,
        product.priceInCents,
        product.stock,
        product.imageUrl,
      ]);
    } catch {
      this.logger.debug('PostgreSQL save unavailable, storing in-memory');
    }
    this.inMemoryStore.set(product.id, product);
  }

  private mapRowToEntity(row: any): Product {
    return new Product({
      id: row.id,
      name: row.name,
      description: row.description,
      priceInCents: Number(row.price_in_cents),
      stock: Number(row.stock),
      imageUrl: row.image_url,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }
}
