import {Inject, Injectable, Injector, OnDestroy, Provider} from '@angular/core';
import {
  Action,
  ActionsSubject,
  INIT,
  INITIAL_STATE,
  ReducerObservable,
  ScannedActionsSubject,
  StateObservable,
  Store
} from '@ngrx/store';
import {BehaviorSubject, isObservable, Observable, queueScheduler, Subscription} from 'rxjs';
import {observeOn, scan, withLatestFrom} from 'rxjs/operators';
import {
  Cancellable,
  Effect,
  ObservableEffect,
  Operand,
  PromiseEffect,
  StateWithEffects,
  SubscriptionToken,
  UnsubscriptionEffect
} from './functions';

@Injectable()
export class State<T> extends BehaviorSubject<any> implements OnDestroy {
  static readonly INIT = INIT;

  private stateSubscription: Subscription;
  private runtime = new Map<SubscriptionToken, Cancellable<any>>();

  constructor(
    actions$: ActionsSubject,
    reducer$: ReducerObservable,
    scannedActions: ScannedActionsSubject,
    @Inject(INITIAL_STATE) initialState: any,
    injector: Injector
  ) {
    super(initialState);

    const actionsOnQueue$: Observable<Action> = actions$.pipe(observeOn(queueScheduler));
    const withLatestReducer$: Observable<[Action, ActionReducer<any>]> = actionsOnQueue$.pipe(withLatestFrom(reducer$));

    const seed: StateActionPair<T> = {state: initialState};
    const stateAndAction$: Observable<{
      state: any;
      action?: Action;
    }> = withLatestReducer$.pipe(
      scan<[Action, ActionReducer<T>], StateActionPair<T>>(reduceState(injector, this.runtime), seed)
    );

    this.stateSubscription = stateAndAction$.subscribe(({state, action}) => {
      this.next(state);
      // tslint:disable-next-line:no-non-null-assertion
      scannedActions.next(action!);
    });
  }

  ngOnDestroy(): void {
    this.stateSubscription.unsubscribe();
    this.complete();
  }
}

export const STATE_PROVIDERS: Provider[] = [State, {provide: StateObservable, useExisting: State}];

export type ReducerResult<T> = T | StateWithEffects<T, any>;

export type ActionReducer<T, V extends Action = Action> = (state: T | undefined, action: V) => ReducerResult<T>;

export type StateActionPair<T, V extends Action = Action> = {
  state: T | undefined;
  action?: V;
};

type Runtime = Map<SubscriptionToken, Cancellable<any>>;

export function reduceState<T, V extends Action = Action>(
  injector: Injector,
  runtime: Runtime
): (
  stateActionPair: StateActionPair<T, V> | undefined,
  [action, reducer]: [V, ActionReducer<T, V>]
) => StateActionPair<T, V> {
  return (stateActionPair, [action, reducer]) => {
    const {state} = stateActionPair ?? {state: undefined};
    const reduced = reducer(state, action);
    let newState: T = handleSliceEffects(reduced);
    // tslint:disable-next-line:forin
    for (const key in newState) {
      newState = {...newState, [key]: handleSliceEffects(newState[key])};
    }
    return {state: newState, action};
  };

  function handleSliceEffects<S>(slicedState: ReducerResult<S>): S {
    if (isStateWithEffects(slicedState)) {
      slicedState.effects.forEach((effect) => handleStateWithEffect(effect, runtime, injector.get(Store)));
      return slicedState.state;
    } else {
      return slicedState;
    }
  }
}

function isStateWithEffects(state: any): state is StateWithEffects<any, any> {
  return state.__brand === 'StateWithEffects';
}

function handleStateWithEffect<E>(effect: Effect<E>, runtime: Runtime, store: Store): void {
  const operand = typeof effect.operation === 'function' ? effect.operation() : effect.operation;
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
    handleUnsubscribe(operand as SubscriptionToken, runtime);
  }
}

function isObservableEffect<E>(effect: Effect<E>, operand: Operand<E>): effect is ObservableEffect<E> {
  return isObservable(operand);
}

function isPromiseEffect<E>(effect: Effect<E>, operand: Operand<E>): effect is PromiseEffect<E> {
  return operand instanceof Promise;
}

function isUnsubscriptionEffect<E>(effect: Effect<E>, operand: Operand<E>): effect is UnsubscriptionEffect<E> {
  return (operand as SubscriptionToken).__brand === 'SubscriptionToken';
}

function handleUnsubscribe(subscriptionToken: SubscriptionToken, runtime: Runtime): void {
  const cancellable = runtime.get(subscriptionToken);
  if (cancellable instanceof Subscription) {
    runtime.delete(subscriptionToken);
    cancellable.unsubscribe();
  } else if (cancellable instanceof AbortController) {
    runtime.delete(subscriptionToken);
    cancellable.abort();
  } else {
    console.warn(`SubscriptionToken ${subscriptionToken} not recognized. Did you cancel this already?`);
  }
}
