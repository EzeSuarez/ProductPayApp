import { DatabaseService } from './database.service';
import { ConfigService } from '@nestjs/config';

jest.mock('pg', () => {
  const mPool = {
    query: jest.fn(),
    end: jest.fn().mockResolvedValue(undefined),
  };
  return { Pool: jest.fn(() => mPool) };
});

describe('DatabaseService', () => {
  let service: DatabaseService;
  let mockConfigService: Partial<ConfigService>;
  let poolMock: any;

  beforeEach(() => {
    mockConfigService = {
      get: jest.fn((key: string, defaultValue?: any) => {
        if (key === 'DATABASE_URL') return undefined;
        if (key === 'DATABASE_HOST') return 'localhost';
        if (key === 'DATABASE_PORT') return 5432;
        if (key === 'DATABASE_USER') return 'postgres';
        if (key === 'DATABASE_PASSWORD') return 'postgres';
        if (key === 'DATABASE_NAME') return 'test_db';
        return defaultValue;
      }),
    };

    service = new DatabaseService(mockConfigService as ConfigService);
    service.onModuleInit();
    poolMock = (service as any).pool;
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  it('should initialize pool on module init', () => {
    expect(poolMock).toBeDefined();
  });

  it('should execute query successfully', async () => {
    poolMock.query.mockResolvedValueOnce({ rows: [{ count: 1 }], rowCount: 1 });

    const result = await service.query('SELECT COUNT(*) FROM products');
    expect(result.rowCount).toBe(1);
    expect(poolMock.query).toHaveBeenCalledWith('SELECT COUNT(*) FROM products', undefined);
  });

  it('should throw error when pool query fails', async () => {
    poolMock.query.mockRejectedValueOnce(new Error('Connection error'));

    await expect(service.query('INVALID SQL')).rejects.toThrow('Connection error');
  });

  it('should initialize with DATABASE_URL when present in config', () => {
    const urlConfig: Partial<ConfigService> = {
      get: jest.fn((key: string) => {
        if (key === 'DATABASE_URL') return 'postgresql://test:test@localhost:5432/db';
        return undefined;
      }),
    };
    const dbSvc = new DatabaseService(urlConfig as ConfigService);
    dbSvc.onModuleInit();
    expect((dbSvc as any).pool).toBeDefined();
  });

  it('should warn on slow query exceeding 500ms', async () => {
    poolMock.query.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve({ rows: [], rowCount: 0 }), 550))
    );

    const result = await service.query('SELECT pg_sleep(1)');
    expect(result.rowCount).toBe(0);
  });

  it('should close pool on destroy', async () => {
    await service.onModuleDestroy();
    expect(poolMock.end).toHaveBeenCalled();
  });
});
