import {Injector} from '@angular/core';
import {Store} from '@ngrx/store';
import {Observable, Subscription} from 'rxjs';
import {ReducerResult} from './reducer';
import {addEffectDescriptions} from './effect-description';
import {
  Cancellable,
  CancellationToken,
  isObservableEffect,
  isPromiseEffect,
  isUnsubscriptionEffect,
  Operand,
  SubscriptionToken,
  UnsubscribeOperation,
  UnsubscriptionEffect
} from './effect';
import {EffectConfig} from './effect-config';
import {StateWithEffects} from './state-with-effects';

export type Runtime = Map<SubscriptionToken, Cancellable<any>>;

export function handleEffects<T>(injector: Injector, runtime: Runtime): (reduced: ReducerResult<T>) => T {
  return (reduced) => {
    let newState: T = handleSliceEffects(reduced);
    // tslint:disable-next-line:forin
    for (const key in newState) {
      newState = {...newState, [key]: handleSliceEffects(newState[key])};
    }
    return newState;
  };

  function handleSliceEffects<S>(slicedState: ReducerResult<S>): S {
    if (isStateWithEffects(slicedState)) {
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

function handleStateWithEffect<TEffect>(effect: EffectConfig<TEffect>, runtime: Runtime, store: Store, injector: Injector): void {
  let operand: Operand<TEffect>;
  try {
    operand = effect.operation(injector.get.bind(injector));
  } catch (err) {
    if (effect.error) {
      try {
        store.dispatch(effect.error(err));
      } catch (innerError) {
        console.error(`Unhandled error occurred when creating error action for effect "${effect.type}"`, innerError);
      }
    } else {
      console.error(`Unhandled error occurred when creating operation for effect "${effect.type}"`, err);
    }
  }

  if (isObservableEffect(effect, operand)) {
    const token = (Math.max(...runtime.keys()) + 1) as SubscriptionToken;

    const subscription = (operand as Observable<TEffect>).subscribe({
      next: (value) => effect.next && store.dispatch(effect.next(value)),
      error: (err) => effect.error && store.dispatch(effect.error(err)),
      complete: () => effect.complete && store.dispatch(effect.complete())
    });
    runtime.set(token, subscription);
    if (effect.subscribe) {
      store.dispatch(effect.subscribe(token));
    }
  } else if (isPromiseEffect(effect, operand)) {
    (operand as Promise<TEffect>).then(
      (value) => effect.complete && store.dispatch(effect.complete(value)),
      (err) => effect.error && store.dispatch(effect.error(err))
    );
  } else if (isUnsubscriptionEffect(effect, operand)) {
    handleUnsubscribe(operand as UnsubscribeOperation, effect, runtime, store);
  } else {
    if (effect.complete) {
      store.dispatch(effect.complete());
    }
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
