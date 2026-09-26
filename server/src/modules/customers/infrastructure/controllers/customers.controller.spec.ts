import { CustomersController } from './customers.controller';

describe('CustomersController', () => {
  let controller: CustomersController;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
    };
    controller = new CustomersController(mockRepository);
  });

  it('should return 200 with customer data when customer exists by id', async () => {
    const mockCustomer = {
      toJSON: () => ({ id: 'c1', fullName: 'Carlos', email: 'carlos@test.com' }),
    };
    mockRepository.findById.mockResolvedValueOnce(mockCustomer);

    const res = await controller.getCustomerById('c1');
    expect(res.statusCode).toBe(200);
    expect(res.data.id).toBe('c1');
  });

  it('should throw NotFoundException when customer id does not exist', async () => {
    mockRepository.findById.mockResolvedValueOnce(null);

    await expect(controller.getCustomerById('unknown-id')).rejects.toThrow();
  });

  it('should return 200 with customer data when customer exists by email', async () => {
    const mockCustomer = {
      toJSON: () => ({ id: 'c1', fullName: 'Carlos', email: 'carlos@test.com' }),
    };
    mockRepository.findByEmail.mockResolvedValueOnce(mockCustomer);

    const res = await controller.getCustomerByEmail('carlos@test.com');
    expect(res.statusCode).toBe(200);
    expect(res.data.email).toBe('carlos@test.com');
  });

  it('should throw NotFoundException when customer email does not exist', async () => {
    mockRepository.findByEmail.mockResolvedValueOnce(null);

    await expect(controller.getCustomerByEmail('unknown@test.com')).rejects.toThrow();
  });
});
