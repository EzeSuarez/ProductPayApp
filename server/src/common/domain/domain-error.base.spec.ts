import {
  EntityNotFoundError,
  ValidationError,
  DomainError,
} from './domain-error.base';

describe('Domain Errors', () => {
  it('EntityNotFoundError should set correct message, code, and status', () => {
    const error = new EntityNotFoundError('Product', '12345');
    expect(error).toBeInstanceOf(DomainError);
    expect(error.message).toBe("Product with ID '12345' was not found.");
    expect(error.code).toBe('ENTITY_NOT_FOUND');
    expect(error.statusCode).toBe(404);
  });

  it('ValidationError should set correct message, code, and status', () => {
    const error = new ValidationError('Card number is invalid');
    expect(error).toBeInstanceOf(DomainError);
    expect(error.message).toBe('Card number is invalid');
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.statusCode).toBe(400);
  });
});
