import { Delivery } from './delivery.entity';

describe('Delivery Entity', () => {
  it('should initialize with defaults and assign tracking number', () => {
    const delivery = new Delivery({
      id: 'deliv-1',
      customerId: 'cust-1',
      addressLine1: 'Carrera 7 # 72-10',
      city: 'Bogota',
      region: 'Cundinamarca',
    });

    expect(delivery.id).toBe('deliv-1');
    expect(delivery.status).toBe('PENDING');
    expect(delivery.trackingNumber).toBeUndefined();

    delivery.assignTracking('TRK-987654');
    expect(delivery.status).toBe('ASSIGNED');
    expect(delivery.trackingNumber).toBe('TRK-987654');

    const json = delivery.toJSON();
    expect(json.status).toBe('ASSIGNED');
    expect(json.trackingNumber).toBe('TRK-987654');
  });
});
