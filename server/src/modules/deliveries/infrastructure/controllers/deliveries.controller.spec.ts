import { DeliveriesController } from './deliveries.controller';

describe('DeliveriesController', () => {
  let controller: DeliveriesController;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      findByCustomerId: jest.fn(),
      save: jest.fn(),
    };
    controller = new DeliveriesController(mockRepository);
  });

  it('should return 200 with delivery data when delivery exists by id', async () => {
    const mockDelivery = {
      toJSON: () => ({ id: 'd1', addressLine1: 'Calle 100', status: 'PENDING' }),
    };
    mockRepository.findById.mockResolvedValueOnce(mockDelivery);

    const res = await controller.getDeliveryById('d1');
    expect(res.statusCode).toBe(200);
    expect(res.data.id).toBe('d1');
  });

  it('should throw NotFoundException when delivery id does not exist', async () => {
    mockRepository.findById.mockResolvedValueOnce(null);

    await expect(controller.getDeliveryById('unknown-id')).rejects.toThrow();
  });

  it('should return list of deliveries for a customer', async () => {
    const mockDeliveries = [
      { toJSON: () => ({ id: 'd1', customerId: 'c1' }) },
      { toJSON: () => ({ id: 'd2', customerId: 'c1' }) },
    ];
    mockRepository.findByCustomerId.mockResolvedValueOnce(mockDeliveries);

    const res = await controller.getDeliveriesByCustomerId('c1');
    expect(res.statusCode).toBe(200);
    expect(res.count).toBe(2);
    expect(res.data).toHaveLength(2);
  });
});
