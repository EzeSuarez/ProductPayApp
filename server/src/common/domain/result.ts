import { DomainError } from './domain-error.base';

export class Ok<T, E = never> {
  readonly isOk = true as const;
  readonly isFail = false as const;
  constructor(readonly value: T) {}
}

export class Fail<T = never, E = DomainError> {
  readonly isOk = false as const;
  readonly isFail = true as const;
  constructor(readonly error: E) {}
}

export type Result<T, E = DomainError> = Ok<T, E> | Fail<T, E>;

export const Result = {
  ok: <T, E = never>(value: T): Result<T, E> => new Ok<T, E>(value),
  fail: <T = never, E = DomainError>(error: E): Result<T, E> => new Fail<T, E>(error),
};
