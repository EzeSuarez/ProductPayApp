import { ProblemDetailsFilter } from './problem-details.filter';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { DomainError } from '../../domain/domain-error.base';

class SampleDomainError extends DomainError {
  readonly code = 'SAMPLE_ERROR';
  readonly statusCode = 422;
}

describe('ProblemDetailsFilter', () => {
  let filter: ProblemDetailsFilter;
  let mockResponse: any;
  let mockRequest: any;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new ProblemDetailsFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockRequest = {
      url: '/api/test',
    };
    mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as any;
  });

  it('should handle DomainError and return RFC 7807 problem details', () => {
    const error = new SampleDomainError('Domain rule violated');
    filter.catch(error, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(422);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'https://httpstatuses.com/422',
        status: 422,
        detail: 'Domain rule violated',
        code: 'SAMPLE_ERROR',
        instance: '/api/test',
      })
    );
  });

  it('should handle NestJS HttpException with object response', () => {
    const error = new HttpException(
      { message: 'Custom object message', error: 'CUSTOM_BAD_REQUEST' },
      HttpStatus.BAD_REQUEST
    );
    filter.catch(error, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 400,
        detail: 'Custom object message',
        code: 'CUSTOM_BAD_REQUEST',
      })
    );
  });

  it('should handle NestJS HttpException with string response', () => {
    const error = new HttpException('Simple string error', HttpStatus.FORBIDDEN);
    filter.catch(error, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 403,
        detail: 'Simple string error',
      })
    );
  });

  it('should handle unhandled native errors with 500 status', () => {
    const error = new Error('Unexpected crash');
    filter.catch(error, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 500,
        title: 'Internal Server Error',
        code: 'INTERNAL_ERROR',
      })
    );
  });
});
