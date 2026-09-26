import { PostgresCustomerRepository } from './postgres-customer.repository';
import { DatabaseService } from '../../../../database/database.service';
import { Customer } from '../../domain/customer.entity';

describe('PostgresCustomerRepository', () => {
  let repository: PostgresCustomerRepository;
  let mockDb: jest.Mocked<DatabaseService>;

  beforeEach(() => {
    mockDb = {
      query: jest.fn(),
    } as any;
    repository = new PostgresCustomerRepository(mockDb);
  });

  it('should save and find customer by id from DB', async () => {
    const customer = new Customer({
      id: 'cust-100',
      fullName: 'Juan Perez',
      email: 'juan@test.com',
      phoneNumber: '+573001112233',
    });

    mockDb.query.mockResolvedValueOnce({ rowCount: 1 } as any);
    await repository.save(customer);

    mockDb.query.mockResolvedValueOnce({
      rows: [
        {
          id: 'cust-100',
          full_name: 'Juan Perez',
          email: 'juan@test.com',
          phone_number: '+573001112233',
          legal_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
    } as any);

    const found = await repository.findById('cust-100');
    expect(found).not.toBeNull();
    expect(found?.email).toBe('juan@test.com');
  });

  it('should fallback to in-memory store when DB throws', async () => {
    const customer = new Customer({
      id: 'cust-mem',
      fullName: 'Memory User',
      email: 'mem@test.com',
      phoneNumber: '+573009998877',
    });

    mockDb.query.mockRejectedValueOnce(new Error('Connection failed'));
    await repository.save(customer);

    mockDb.query.mockRejectedValueOnce(new Error('Connection failed'));
    const found = await repository.findById('cust-mem');
    expect(found).not.toBeNull();
    expect(found?.fullName).toBe('Memory User');

    mockDb.query.mockRejectedValueOnce(new Error('Connection failed'));
    const byEmail = await repository.findByEmail('mem@test.com');
    expect(byEmail).not.toBeNull();
    expect(byEmail?.id).toBe('cust-mem');
  });
});
