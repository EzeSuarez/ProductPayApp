import { Customer } from './customer.entity';

describe('Customer Entity', () => {
  it('should initialize and serialize to JSON correctly', () => {
    const customer = new Customer({
      id: 'cust-1',
      fullName: 'Elena Restrepo',
      email: 'elena@example.com',
      phoneNumber: '+573109876543',
      legalId: 'CC-1098765432',
    });

    expect(customer.id).toBe('cust-1');
    expect(customer.fullName).toBe('Elena Restrepo');
    expect(customer.email).toBe('elena@example.com');
    expect(customer.phoneNumber).toBe('+573109876543');
    expect(customer.legalId).toBe('CC-1098765432');

    const json = customer.toJSON();
    expect(json.fullName).toBe('Elena Restrepo');
    expect(json.email).toBe('elena@example.com');
  });
});
