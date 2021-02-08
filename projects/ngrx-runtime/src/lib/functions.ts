import {Observable, Subscription} from 'rxjs';
import {Action} from '@ngrx/store';

export type DispatchSubscriber<T> = {
  next: (value: T) => Action;
  error?: (err: any) => Action;
  complete?: () => Action;
};

export type DispatchResolver<T> = {
  resolve: (value: T) => Action;
  reject?: (err: any) => Action;
};

type CancelTokenReducer<S> = (cancelToken: CancelToken) => S;

export type ObservableEffect<T> = {
  effect: Observable<T>;
  handler: DispatchSubscriber<T>;
};

export type PromiseEffect<T> = {
  effect: Promise<T>;
  handler: DispatchResolver<T>;
  abortController?: AbortController;
};

export type StateWithEffect<S, E> = {
  __brand: 'StateWithEffect';
  stateFn: CancelTokenReducer<S>;
} & (ObservableEffect<E> | PromiseEffect<E>);

export type StateWithCancellation<S> = {
  __brand: 'StateWithCancellation';
  state: S;
  cancelToken: CancelToken;
};

export type CancelToken = number & { _brand: 'CancelToken' };

export type Cancellable<T> = Subscription | AbortController;

export function withEffect<S, E>(state: S, effect: Promise<E>, handler: DispatchResolver<E>): StateWithEffect<S, E>;
export function withEffect<S, E>(
  state: S | CancelTokenReducer<S>,
  effect: Promise<E>,
  handler: DispatchResolver<E>,
  abortController?: AbortController
): StateWithEffect<S, E>;
export function withEffect<S, E>(
  state: S | CancelTokenReducer<S>,
  effect: Observable<E>,
  handler: DispatchSubscriber<E>
): StateWithEffect<S, E>;
export function withEffect<S, E>(
  state: S | CancelTokenReducer<S>,
  effect: Observable<E> | Promise<E>,
  handler: DispatchSubscriber<E> | DispatchResolver<E>,
  abortController?: AbortController
): StateWithEffect<S, E> {
  return {
    __brand: 'StateWithEffect',
    stateFn: typeof state === 'function' ? (state as CancelTokenReducer<S>) : (_) => state,
    effect,
    handler
  } as StateWithEffect<S, E>;
}

export function withCancellation<S>(state: S, cancelToken: CancelToken): StateWithCancellation<S> {
  return {
    __brand: 'StateWithCancellation',
    state,
    cancelToken
  };
}
