import { Injector } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  Cancellable,
  CancellationToken,
  Effect,
  ObservableEffect,
  Operand,
  PromiseEffect,
  StateWithEffects,
  SubscriptionToken,
  UnsubscribeOperation,
  UnsubscriptionEffect
} from './functions';
import { isObservable, Observable, Subscription } from 'rxjs';
import { ReducerResult } from './types';
import {addEffectDescriptions} from './effect-description';
import {isObservableEffect, isPromiseEffect, isUnsubscriptionEffect} from './effect-type';

export type Runtime = Map<SubscriptionToken, Cancellable<any>>;

export function handleEffects<T>(injector: Injector, runtime: Runtime): (reduced: ReducerResult<T>) => T {
  return (reduced) => {
    let newState: T = handleSliceEffects(reduced);
    // tslint:disable-next-line:forin
    for (const key in newState) {
      newState = { ...newState, [key]: handleSliceEffects(newState[key]) };
    }
    return newState;
  };

  function handleSliceEffects<S>(slicedState: ReducerResult<S>): S {
    if (isStateWithEffects(slicedState)) {
      // @ts-ignore
      slicedState.effects.forEach((effect) => handleStateWithEffect(effect, runtime, injector.get(Store), injector));
      return addEffectDescriptions(slicedState.state, slicedState.effects);
    } else {
      return slicedState;
    }
  }
}


function isStateWithEffects(state: any): state is StateWithEffects<any, any> {
  return state?.__brand === 'StateWithEffects';
}

function handleStateWithEffect<E>(effect: Effect<E>, runtime: Runtime, store: Store, injector: Injector): void {
  const operand = effect.operation(injector.get.bind(injector));
  if (isObservableEffect(effect, operand)) {
    const token = (Math.max(...runtime.keys()) + 1) as SubscriptionToken;

    const subscription = (operand as Observable<E>).subscribe({
      next: (value) => store.dispatch(effect.next(value)),
      error: (err) => effect.error && store.dispatch(effect.error(err)),
      complete: () => effect.complete && store.dispatch(effect.complete())
    });
    runtime.set(token, subscription);
    if (effect.subscribe) {
      store.dispatch(effect.subscribe(token));
    }
  } else if (isPromiseEffect(effect, operand)) {
    (operand as Promise<E>).then(
      (value) => store.dispatch(effect.resolve(value)),
      (err) => effect.reject && store.dispatch(effect.reject(err))
    );
  } else if (isUnsubscriptionEffect(effect, operand)) {
    handleUnsubscribe(operand as UnsubscribeOperation, effect, runtime, store);
  }
}

function handleUnsubscribe(
  operation: UnsubscribeOperation,
  effect: UnsubscriptionEffect<any>,
  runtime: Runtime,
  store: Store
): void {
  const cancellable = runtime.get(operation.subscriptionToken);
  if (cancellable instanceof Subscription) {
    runtime.delete(operation.subscriptionToken);
    cancellable.unsubscribe();
  } else if (cancellable instanceof AbortController) {
    runtime.delete(operation.subscriptionToken);
    cancellable.abort();
  } else {
    console.warn(`SubscriptionToken ${operation.subscriptionToken} not recognized. Did you cancel this already?`);
  }
  if (effect.unsubscribe) {
    store.dispatch(effect.unsubscribe(0 as CancellationToken));
  }
}
