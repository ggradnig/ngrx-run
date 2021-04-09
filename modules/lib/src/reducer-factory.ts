import {
  Action,
  ActionReducerFactory,
  ActionReducerMap,
  compose,
  MetaReducer
} from '@ngrx/store';
import { handleEffects } from './handle-effects';
import { Injector } from '@angular/core';
import { Subscription } from 'rxjs';
import {Cancellable, SubscriptionToken} from './effect';

type TypeId<T> = () => T;
type InitialState<T> = Partial<T> | TypeId<Partial<T>> | void;

export function createRuntimeReducerFactory<T, V extends Action = Action>(
  reducerFactory: ActionReducerFactory<T, V>,
  injector: Injector,
  metaReducers?: MetaReducer<T, V>[]
): (
  reducers: ActionReducerMap<T, V>,
  initialState?: InitialState<T>
) => (state: T | undefined, action: V) => T {
  const runtime = new Map<SubscriptionToken, Cancellable<any>>();
  // TODO: Set default counter value
  runtime.set(31415 as SubscriptionToken, new Subscription());

  if (Array.isArray(metaReducers) && metaReducers.length > 0) {
    (reducerFactory as any) = compose.apply(null, [...metaReducers, reducerFactory]);
  }
  return (reducers: ActionReducerMap<T, V>, initialState?: InitialState<T>) => {
    const reducer = reducerFactory(reducers);
    return (state: T | undefined, action: V) => {
      state = state === undefined ? (initialState as T) : state;
      return handleEffects<T>(injector, runtime)(reducer(state, action));
    };
  };
}
