import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, QueryResult, QueryResultRow } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool!: Pool;
  private readonly logger = new Logger(DatabaseService.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const connectionString = this.configService.get<string>('DATABASE_URL');
    const host = this.configService.get<string>('DATABASE_HOST', 'localhost');
    const port = Number(this.configService.get<number>('DATABASE_PORT', 5432));
    const user = this.configService.get<string>('DATABASE_USER', 'postgres');
    const password = this.configService.get<string>('DATABASE_PASSWORD', 'postgrespassword');
    const database = this.configService.get<string>('DATABASE_NAME', 'product_pay_db');

    if (connectionString) {
      this.pool = new Pool({ connectionString });
    } else {
      this.pool = new Pool({
        host,
        port,
        user,
        password,
        database,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });
    }

    this.logger.log(`PostgreSQL Pool initialized for database: ${database}`);
  }

  async query<T extends QueryResultRow = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    const start = Date.now();
    try {
      const res = await this.pool.query<T>(text, params);
      const duration = Date.now() - start;
      if (duration > 500) {
        this.logger.warn(`Slow query detected (${duration}ms): ${text}`);
      }
      return res;
    } catch (error: any) {
      this.logger.error(`Database query failed: ${error.message} (Query: ${text})`);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
      this.logger.log('PostgreSQL Pool closed.');
    }
  }
}
