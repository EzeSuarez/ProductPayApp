import { PostgresDeliveryRepository } from './postgres-delivery.repository';
import { DatabaseService } from '../../../../database/database.service';
import { Delivery } from '../../domain/delivery.entity';

describe('PostgresDeliveryRepository', () => {
  let repository: PostgresDeliveryRepository;
  let mockDb: jest.Mocked<DatabaseService>;

  beforeEach(() => {
    mockDb = {
      query: jest.fn(),
    } as any;
    repository = new PostgresDeliveryRepository(mockDb);
  });

  it('should save and find delivery by id from DB', async () => {
    const delivery = new Delivery({
      id: 'deliv-100',
      customerId: 'cust-100',
      addressLine1: 'Calle 123',
      city: 'Medellin',
      region: 'Antioquia',
    });

    mockDb.query.mockResolvedValueOnce({ rowCount: 1 } as any);
    await repository.save(delivery);

    mockDb.query.mockResolvedValueOnce({
      rows: [
        {
          id: 'deliv-100',
          customer_id: 'cust-100',
          address_line1: 'Calle 123',
          address_line2: null,
          city: 'Medellin',
          region: 'Antioquia',
          postal_code: null,
          status: 'PENDING',
          tracking_number: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
    } as any);

    const found = await repository.findById('deliv-100');
    expect(found).not.toBeNull();
    expect(found?.city).toBe('Medellin');
  });

  it('should fallback to in-memory store and find by customer id', async () => {
    const delivery = new Delivery({
      id: 'deliv-mem',
      customerId: 'cust-shared',
      addressLine1: 'Avenida 68',
      city: 'Bogota',
      region: 'Cundinamarca',
    });

    mockDb.query.mockRejectedValueOnce(new Error('DB offline'));
    await repository.save(delivery);

    mockDb.query.mockRejectedValueOnce(new Error('DB offline'));
    const list = await repository.findByCustomerId('cust-shared');
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe('deliv-mem');
  });
});
